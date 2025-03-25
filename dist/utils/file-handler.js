"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHandler = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class FileHandler {
    static readJsonFile(filePath) {
        try {
            return fs_extra_1.default.readJSONSync(filePath);
        }
        catch (error) {
            console.error("Error reading JSON file:", error);
            throw error;
        }
    }
    static writeJsonFile(filePath, data) {
        try {
            fs_extra_1.default.ensureDirSync(path_1.default.dirname(filePath));
            fs_extra_1.default.writeJSONSync(filePath, data, { spaces: 2 });
        }
        catch (error) {
            console.error("Error writing JSON file:", error);
            throw error;
        }
    }
    static async translateJsonRecursively(jsonObject, translator) {
        if (typeof jsonObject === "string") {
            return await translator(jsonObject);
        }
        if (Array.isArray(jsonObject)) {
            return Promise.all(jsonObject.map((item) => this.translateJsonRecursively(item, translator)));
        }
        if (typeof jsonObject === "object" && jsonObject !== null) {
            const translatedObject = {};
            for (const [key, value] of Object.entries(jsonObject)) {
                translatedObject[key] = await this.translateJsonRecursively(value, translator);
            }
            return translatedObject;
        }
        return jsonObject;
    }
}
exports.FileHandler = FileHandler;
