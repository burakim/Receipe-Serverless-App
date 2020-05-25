import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { RecipeItem } from "../../models/RecipeItem";
import { RecipeUpdate } from "../../models/RecipeUpdate";
import { createLogger } from '../../utils/logger';

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('auth')


export class DatabaseOperations {
    private docClient: DocumentClient = createDynamoDBClient();
    private S3;
    private recipesTable;
    private bucket;
    private index;

  constructor() {
    this.docClient = createDynamoDBClient(),
    this.S3 = createS3Bucket();
    this.recipesTable = process.env.TABLE_NAME;
    this.bucket = process.env.BUCKET_NAME;
    this.index = process.env.SECONDARY_INDEX_NAME;
  }

  async getAllRecipes(userId: string): Promise<RecipeItem[]> {
    logger.info(`userID: ${userId} is fetching all recipes`);
    const result = await this.docClient
      .query({
        TableName: this.recipesTable,
        IndexName: this.index,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId
        }
      })
      .promise();
    return result.Items as RecipeItem[];
  }

  async createRecipeItem(recipe: RecipeItem): Promise<RecipeItem> {
    await this.docClient
      .put({
        TableName: this.recipesTable,
        Item: recipe
      })
      .promise();
    logger.info(`New Recipe Created`, recipe);
    return recipe;
  }

  async deleteRecipe(recipeId: string, userId: string) {
    logger.info(`userID: ${userId} is deleting the recipe (id: ${recipeId}))`);
    const deletedRecipe = await this.docClient
      .delete({
        TableName: this.recipesTable,
        Key: { userId, recipeId }
      })
      .promise();
    return deletedRecipe;
  }
  async updateRecipe(userId: string, recipeId: string, updatedRecipe: RecipeUpdate) {
    logger.info(`userID: ${userId} is updating the recipe (id: ${recipeId}))`, updatedRecipe);
    const updatedRecipeReturn = await this.docClient
      .update({
        TableName: this.recipesTable,
        Key: { userId, recipeId },
        UpdateExpression: "set title=:title, description=:description",
        ExpressionAttributeValues: {
          ":title": updatedRecipe.title,
          ":description": updatedRecipe.description
        },
        ReturnValues: "UPDATED_NEW"
      })
      .promise();
    return updatedRecipeReturn;
  }
  async generateUploadUrl(recipeId: string, userId: string): Promise<SignedUrl> {
    logger.info(`userID: ${userId} is generating the recipe attachment for the recipe (id: ${recipeId}))`);
    const uploadUrl = this.S3.getSignedUrl("putObject", {
      Bucket: this.bucket,
      Key: recipeId,
      Expires: 36000
    });
    await this.docClient
      .update({
        TableName: this.recipesTable,
        Key: { userId, recipeId },
        UpdateExpression: "set attachmentUrl=:URL",
        ExpressionAttributeValues: {
          ":URL": uploadUrl.split("?")[0]
        },
        ReturnValues: "UPDATED_NEW"
      })
      .promise();

    return {url: uploadUrl};
  }
}

function createDynamoDBClient() {
  return new XAWS.DynamoDB.DocumentClient();
}

function createS3Bucket() {
  return new XAWS.S3({
    signatureVersion: "v4"
  });
}