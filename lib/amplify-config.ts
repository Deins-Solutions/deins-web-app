import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  try {
    const userPoolId = process.env.USER_POOL_ID;
    const userPoolClientId = process.env.CLIENT_ID;

    if (!userPoolId || !userPoolClientId) {
      console.error("One or more required Cognito environment variables are not set.");
      return;
    }

    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
        }
      },
    });
    console.log("Amplify configured successfully");
  } catch (error) {
    console.error("Error configuring Amplify:", error);
  }
}
