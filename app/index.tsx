import { Button, Text, View } from "react-native";
import notifee, { EventType, TriggerType } from "@notifee/react-native";
import * as React from "react";
import { MMKV, useMMKVString } from "react-native-mmkv";
import axios from "axios";

const storage = new MMKV();
const NOTIFICATION_CATEGORY = "test-notification-category";

notifee.setNotificationCategories([
  {
    id: NOTIFICATION_CATEGORY,
    actions: [
      {
        id: "async-action",
        title: "Async Action",
        authenticationRequired: true,
        foreground: false,
      },
      {
        id: "sync-action",
        title: "Sync Action",
        authenticationRequired: true,
        foreground: false,
      },
    ],
  },
]);

notifee.onBackgroundEvent(async (event) => {
  if (event.type === EventType.ACTION_PRESS) {
    if (event.detail.pressAction?.id === "async-action") {
      logToStorage("Doing async action");
      logToStorage(
        "Sync actions will be shown in the console when the app is in background"
      );
      logToStorage("But let's try to fetch some data from the server...");
      const data = await axios(
        "https://jsonplaceholder.typicode.com/todos/1"
      ).then((response) => response.data);
      logToStorage("Data fetched successfully");
      logToStorage("Fetching only started when the app was in foreground");
    } else if (event.detail.pressAction?.id === "sync-action") {
      logToStorage("Doing sync action");
      logToStorage(
        "All logs will be shown in the console, even if the app is in background"
      );
    }
  }
});

const logToStorage = (message: string) => {
  const prev = storage.getString("logs") || "";

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
  const time = `${hours}:${minutes}:${seconds}.${milliseconds}`;

  const formattedMessage = `[${time}] ${message}`;

  if (__DEV__) {
    console.log(formattedMessage);
  }

  storage.set("logs", `${prev}\n${formattedMessage}`);
};

const Logs = () => {
  const [logs] = useMMKVString("logs");

  return <Text>{logs ?? "No logs"}</Text>;
};

export default function Index() {
  React.useEffect(() => {
    // Request permissions
    notifee.requestPermission().catch(console.error);
  }, []);

  const showNotification = () =>
    notifee
      .createTriggerNotification(
        {
          ios: {
            categoryId: NOTIFICATION_CATEGORY,
          },
          title: "Test Notification",
          body: "This is a test notification",
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: new Date(Date.now() + 3000).getTime(),
        }
      )
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
      <Button
        title="Clear logs"
        onPress={() => {
          storage.delete("logs");
        }}
      />
      <Text>(Put the app in background after pressing)</Text>
      <Logs />
    </View>
  );
}
