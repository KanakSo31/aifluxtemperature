import express from "express";
import { PrismaClient } from "@prisma/client";
import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");

mqttClient.on("connect", () => {
  mqttClient.subscribe("aiflux/test_topic", (err) => {
    if (err) {
      console.error("Subscription error:", err);
    }
  });
});

mqttClient.on("message", async (topic, message) => {
  const temperature = parseInt(message.toString());
  await prisma.temperature.create({
    data: {
      value: temperature,
    },
  });
  console.log(`Stored temperature: ${temperature}`);
});

// REST endpoint to fetch temperatures
app.get("/temperatures", async (req, res) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 1); // last minute
  const temperatures = await prisma.temperature.findMany({
    where: {
      timestamp: {
        gte: now,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });
  res.json(temperatures);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
