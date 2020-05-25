import * as uuid from "uuid";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DatabaseOperations } from './databaseOperations';
import { getUserId } from '../utils';
import { RecipeItem } from "../../models/RecipeItem";
import { CreateRecipeRequest } from "../../requests/CreateRecipeRequest";

const dbOperationFunctions = new DatabaseOperations();

export async function getAllRecipes(
  event: APIGatewayProxyEvent
): Promise<RecipeItem[]> {
  return dbOperationFunctions.getAllRecipes(getUserId(event));
}

export function createRecipe(
  event: APIGatewayProxyEvent
): Promise<RecipeItem> {
  const newRecipe: CreateRecipeRequest =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  return  dbOperationFunctions.createRecipeItem({
    userId: getUserId(event),
    recipeId: uuid.v4(),
    createdAt: new Date().toISOString(),
    ...newRecipe
  });
}
export async function generateUploadUrl(
  event: APIGatewayProxyEvent
): Promise<SignedUrl> {
  return dbOperationFunctions.generateUploadUrl(
    event.pathParameters.recipeId, 
    getUserId(event));
}
export async function updateRecipe(event: APIGatewayProxyEvent) {
  return dbOperationFunctions.updateRecipe(
    getUserId(event),
    event.pathParameters.recipeId,
    JSON.parse(event.body)
      );
}
export async function deleteRecipe(event: APIGatewayProxyEvent) {
  return dbOperationFunctions.deleteRecipe(event.pathParameters.recipeId, getUserId(event));
}