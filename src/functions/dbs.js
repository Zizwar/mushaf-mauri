import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
const folderSqlit = `${FileSystem.documentDirectory}SQLite`;
const execSql = async (sql, params = [], db) => {
  return new Promise((resolve, reject) =>
    db.transaction((tx) => {
      tx.executeSql(sql, params, (_, { rows }) => resolve(rows._array));
    })
  );
};

export class dbs {
  constructor(author) {
    this.author = author;
    this.db = null;
  }
  async connect() {
    let folderSqlitInfo = await FileSystem.getInfoAsync(folderSqlit);
    console.log({ folderSqlitInfo });
    listDB = folderSqlitInfo.exists
      ? await FileSystem.readDirectoryAsync(folderSqlit)
      : null;
    console.log({ listDB });

    this.db = listDB.includes(`${this.author}.db`)
      ? SQLite.openDatabase(`${this.author}.db`)
      : null;
  }
  get ping() {
    return this.db;
  }

  async execSql(sql, params = []) {
    return await execSql(sql, params, this.db);
  }
}
