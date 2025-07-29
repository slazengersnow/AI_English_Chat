"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("react-dom/client");
const App_1 = __importDefault(require("./App"));
require("./index.css");
(0, client_1.createRoot)(document.getElementById("root")).render(<App_1.default />);
