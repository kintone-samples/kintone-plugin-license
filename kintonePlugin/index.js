/*
 * kintone plugin license sample program
 * Copyright (c) 2024 Cybozu
 *
 * Licensed under the MIT License
 * https://opensource.org/license/mit/
 */

((PLUGIN_ID) => {
  const fetchLicense = async () => {
    // Amazon API Gatewayの構築でメモしたエンドポイントを指定する。末尾には「/license」を付与する。
    const url =
      "https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/license";
    const method = "POST";
    const headers = { "Content-Type": "application/json" };
    const body = { domain: window.location.hostname, pluginId: PLUGIN_ID };
    const response = await kintone.proxy(url, method, headers, body);
    return JSON.parse(response[0]);
  };

  const isValid = (responseBody) => {
    return responseBody && responseBody.message === "Valid";
  };

  kintone.events.on(["app.record.index.show"], async (event) => {
    try {
      const license = await fetchLicense();

      if (!isValid(license)) {
        console.info("プラグインのライセンスは無効です。");
        return event;
      }

      console.info("プラグインのライセンスは有効です。");
      return event;
    } catch (error) {
      console.error(error);
      alert("プラグインの処理中にエラーが発生しました。");
    }

    return event;
  });
})(kintone.$PLUGIN_ID);
