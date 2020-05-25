import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { updateRecipe } from '../operations/RecipeOperations';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const updatedToDo = await updateRecipe(event);
  return {
    statusCode: 200,
    body: JSON.stringify({ msg: "successfully updated", updated: updatedToDo }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    }
  };
}
