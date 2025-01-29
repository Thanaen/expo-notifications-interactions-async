import { Button, Text, View } from "react-native";
import * as Notifications from "expo-notifications";
import * as React from "react";

const NOTIFICATION_CATEGORY = "test-notification-category";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Index() {
  React.useEffect(() => {
    // Request permissions
    Notifications.requestPermissionsAsync().catch(console.error);

    // Setup notifications categories
    Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY, [
      {
        identifier: "async-action",
        buttonTitle: "Async Action",
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: "sync-action",
        buttonTitle: "Sync Action",
        options: {
          opensAppToForeground: false,
        },
      },
    ]).catch(console.error);

    const responseHandler =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          if (response.actionIdentifier === "async-action") {
            console.log("Doing async action");
            console.log(
              "Sync actions will be shown in the console when the app is in background"
            );
            console.log("But let's try to fetch some data from the server...");
            const data = await fetch(
              "https://jsonplaceholder.typicode.com/todos/1"
            ).then((response) => response.json());
            console.log("Data fetched successfully", data);
            console.log("Fetching only started when the app was in foreground");
          } else if (response.actionIdentifier === "sync-action") {
            console.log("Doing sync action");
            console.log(
              "All logs will be shown in the console, even if the app is in background"
            );
          }
        }
      );

    return () => {
      responseHandler.remove();
    };
  }, []);

  const showNotification = () =>
    Notifications.scheduleNotificationAsync({
      identifier: "test-notification",
      content: {
        categoryIdentifier: NOTIFICATION_CATEGORY,
        title: "Test Notification",
        body: "This is a test notification",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        // Show the notification in 3 seconds
        date: new Date(Date.now() + 3000),
      },
    })
      .then(() => {
        console.log("Notification scheduled");
      })
      .catch(console.error);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button
        title="Show Notification in 3 seconds"
        onPress={showNotification}
      />
      <Text>(Put the app in background after pressing)</Text>
    </View>
  );
}
