/*
 * kintone plugin license sample program
 * Copyright (c) 2024 Cybozu
 *
 * Licensed under the MIT License
 * https://opensource.org/license/mit/
 */

import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const tz = "Asia/Tokyo";

const validateRequestBody = (requestBody: any): requestBody is RequestBody => {
  return (
    typeof requestBody.domain === "string" &&
    typeof requestBody.pluginId === "string"
  );
};

const isLicenseValid = (expirationDate: string) => {
  const now = dayjs().tz(tz);
  const expiration = dayjs(expirationDate, "YYYY-MM-DD");

  return now.isSameOrBefore(expiration, "day");
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is required." }),
    };
  }

  const requestBody = JSON.parse(event.body);
  if (!validateRequestBody(requestBody)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request body." }),
    };
  }

  const logger = new Logger({
    serviceName: "kintonePluginLicense",
  });

  try {
    const dynamoDbClient = new DynamoDB();
    const params = {
      TableName: process.env.LICENSE_TABLE_NAME,
      Key: marshall({
        domain: requestBody.domain,
        pluginId: requestBody.pluginId,
      }),
    };
    const result = await dynamoDbClient.getItem(params);

    const statusCode = result.$metadata.httpStatusCode || 200;
    const item =
      result.Item !== undefined
        ? (unmarshall(result.Item) as LicenseItem)
        : undefined;
    if (!item) {
      logger.info("No item found", { requestBody });
      return {
        statusCode,
        body: JSON.stringify({ message: "No item found." }),
      };
    }

    if (!isLicenseValid(item.expirationDate)) {
      logger.info("License is invalid", { item });
      return {
        statusCode,
        body: JSON.stringify({
          message: "Invalid",
        }),
      };
    }

    logger.info("License is valid", { item });
    return {
      statusCode,
      body: JSON.stringify({
        message: "Valid",
      }),
    };
  } catch (error) {
    logger.error("Error occurred", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error." }),
    };
  }
};
