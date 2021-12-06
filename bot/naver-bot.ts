require('chromedriver');
import webdriver, { By, until, Key } from 'selenium-webdriver';
import { WriteInformationType } from '..';
import cliboardy from '../utils/cliboardy';
import sleep from '../utils/sleep';

async function naverBot({
  userId,
  userPw,
  originContentsUrl,
  targetCafeUrl,
  title,
  category,
}: WriteInformationType) {
  const driver = new webdriver.Builder().forBrowser('chrome').build();
  const actions = driver.actions({ async: true, bridge: true });

  const metaKey = process.platform === 'win32' ? Key.CONTROL : Key.META;

  const config: WriteInformationType = {
    userId,
    userPw,
    originContentsUrl,
    targetCafeUrl,
    title,
    category,
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
    await cliboardy(`${config.userId}`);
    idInput.sendKeys(metaKey + 'V');
    await sleep(1000);

    // password
    await cliboardy(`${config.userPw}`);
    pwInput.sendKeys(metaKey + 'V');

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
    await actions.keyDown(metaKey).sendKeys('a').keyUp(metaKey).perform();

    await sleep(1000);
    await actions.keyDown(metaKey).sendKeys('c').keyUp(metaKey).perform();
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

    await sleep(2000);

    // // 제목 입력하기
    // await driver.wait(until.elementLocated(By.className('textarea_input')));
    // const titleInput = await driver.findElement(By.className('textarea_input'));

    // if (titleInput) {
    //   titleInput.click();
    //   await titleInput.sendKeys(`${config.title}`);
    // }

    // await sleep(1000);

    // // 글쓰기
    // const contents = await driver.findElement(
    //   By.xpath('//span[contains(text(),"내용을")]'),
    // );

    // contents.click();
    // await actions.keyDown(metaKey).sendKeys('v').keyUp(metaKey).perform();

    // 카테고리 선택
    await driver.wait(until.elementLocated(By.className('FormSelectButton')));
    const selectorBox = await driver.findElement(
      By.css('.FormSelectButton > button'),
    );

    // await driver.executeScript(`
    //   const option = document.querySelector('.option_list');
    //   option.style.display = 'block !important';
    // `);

    if (selectorBox) {
      await actions.move({ origin: selectorBox }).click().perform();

      const options = await driver
        .findElement(By.css('.option_list'))
        .findElements(By.className('item'));

      await sleep(1000);

      let categoryIndex: null | number = null;
      await Promise.all(
        options.map(async (el, index) => {
          const text = await el.findElement(By.css('button')).getText();
          console.log(config.category);
          if (text.trim().includes(config.category as string)) {
            categoryIndex = index;
          }
        }),
      );

      if (categoryIndex === null) {
        throw new Error('선택하신 카테고리를 찾지 못했습니다.');
      }

      options[categoryIndex].click();

      await sleep(2000);

      await driver.wait(until.alertIsPresent(), 2000);
      const alert = await driver.switchTo().alert();

      if (alert) {
        await alert.accept();
      }
    }
    console.log('paste');
  } catch (err) {
    console.log(err);
  }
}

export default naverBot;
