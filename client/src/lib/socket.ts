import { io } from "socket.io-client";

const URL = "http://localhost:8000"; // Replace with your server URL in prod
export const socket = io(URL);
