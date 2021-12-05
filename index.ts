import xlsx from 'node-xlsx';
import path from 'path';
import fs from 'fs';
import naverBot from './bot/naver-bot';

export type WriteInformationType = {
  userId: string | unknown;
  userPw: string | unknown;
  originContentsUrl: string | unknown;
  targetCafeUrl: string | unknown;
  title: string | unknown;
  category: string | unknown;
};

(async function () {
  const inputFilePath = path.resolve(__dirname, './xlsx/input.xlsx');

  if (!fs.existsSync(inputFilePath)) {
    throw new Error('input 엑셀 파일이 존재하지 않습니다.');
  }

  // To-do delete-list.xlsx 파일이 존재하면 자동으로 삭제 하도록 처리

  const inputSheet = xlsx.parse(inputFilePath);
  const { data } = inputSheet[0];

  const writeInformations = data
    .slice(1, data.length)
    .map((row, index) => {
      if (row.filter(Boolean).length !== 6) {
        console.error(
          `${index + 1} 번째 줄에서 필수 항목중에 존재하지 않는 값이 있습니다.`,
        );
        process.exit(1);
      }

      const result = {
        userId: row[0],
        userPw: row[1],
        originContentsUrl: row[2],
        targetCafeUrl: row[3],
        title: row[4],
        category: row[5],
      };
      return result;
    })
    .filter(Boolean);

  // Run naver cafe bot
  await Promise.all(
    writeInformations.map(async (config) => await naverBot(config)),
  );
})();
