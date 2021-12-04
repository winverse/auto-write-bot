require('chromedriver');
import webdriver, { By, until, Key } from 'selenium-webdriver';
import cliboardy from './utils/cliboardy';
import sleep from './utils/sleep';

(async function () {
  const driver = new webdriver.Builder().forBrowser('chrome').build();
  const actions = driver.actions({ async: true, bridge: true });

  const config = {
    id: process.env.userID,
    pw: process.env.userPW,
    originContentsUrl: process.env.originContentsUrl,
    targetCafeUrl: process.env.targetCafeUrl,
    title: process.env.title,
    category: process.env.category || '반도체',
  };

  if (!config.category) {
    throw new Error('Missing value');
  }

  // 로그인
  try {
    await driver.get('https://nid.naver.com/nidlogin.login');

    await driver.wait(until.elementLocated(By.id('id')));
    await driver.wait(until.elementLocated(By.id('pw')));

    const idInput = driver.findElement(By.id('id'));
    const pwInput = driver.findElement(By.id('pw'));

    // id
    await cliboardy(`${config.id}`);
    idInput.sendKeys(Key.META + 'V');
    await sleep(1000);

    // password
    await cliboardy(`${config.pw}`);
    pwInput.sendKeys(Key.META + 'V');

    const loginButton = driver.findElement(By.id('log.login'));
    loginButton.click();

    await sleep(1000);
  } catch (err) {
    console.log(err);
    await driver.quit();
  }

  try {
    // 미리 입력한 글 수정 경로
    await driver.get(`${config.originContentsUrl}`);
    await sleep(3000);

    await driver.wait(until.elementLocated(By.className('se-content')));
    const container = driver.findElement(By.className('se-component-content'));
    const offset = await container.getRect();

    driver.executeScript(
      'return window.scrollTo(' + offset.x + ',' + (offset.height + 400) + ');',
    );

    await sleep(1000);

    await driver.wait(until.elementLocated(By.className('se-component')));
    const frame = driver.findElement(By.xpath('//*[contains(text(),본문)]'));
    frame.click();

    await sleep(1000);
    await actions.keyDown(Key.META).sendKeys('a').keyUp(Key.META).perform();

    await sleep(1000);
    await actions.keyDown(Key.META).sendKeys('c').keyUp(Key.META).perform();
  } catch (err) {
    console.log(err);
    await driver.quit();
  }

  try {
    // 카페 고유 id 구하기
    const targetSite = `${config.targetCafeUrl}`;
    await driver.switchTo().newWindow('tab');
    await driver.get(targetSite);
    await driver.wait(until.elementLocated(By.name('clubid')));
    const clubIdInput = await driver.findElement(By.name('clubid'));
    const clubId = await clubIdInput.getAttribute('value');

    // 글쓰기 화면 이동
    const targetSiteWriteURI = `https://cafe.naver.com/ca-fe/cafes/${clubId}/articles/write?boardType=L`;
    driver.get(targetSiteWriteURI);

    await sleep(1000);

    await driver.wait(until.elementLocated(By.className('FormSelectButton')));
    const selectorBox = await driver.findElement(
      By.css('.FormSelectButton > .button'),
    );

    selectorBox.click();

    // 카테고리 선택
    const options = await driver
      .findElement(By.css('.option_list'))
      .findElements(By.className('item'));

    await sleep(1000);

    let categoryIndex: null | number = null;
    await Promise.all(
      options.map(async (el, index) => {
        const text = await el.findElement(By.css('button')).getText();
        if (text.trim().includes(config.category)) {
          categoryIndex = index;
        }
      }),
    );

    if (categoryIndex === null) {
      throw new Error('선택하신 카테고리를 찾지 못했습니다.');
    }

    options[categoryIndex].click();
    await sleep(1000);

    // 제목 입력하기
    const titleInput = await driver.findElement(By.className('textarea_input'));

    titleInput.click();
    await titleInput.sendKeys(`${config.title}`);

    await sleep(1000);

    // 글쓰기
    const contents = await driver.findElement(
      By.xpath('//span[contains(text(),"내용을")]'),
    );

    contents.click();
    await actions.keyDown(Key.META).sendKeys('v').keyUp(Key.META).perform();

    console.log('paste');
  } catch (err) {
    console.log(err);
    await driver.quit();
  }
})();
