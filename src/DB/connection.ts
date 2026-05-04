import { connect } from "mongoose";
import { DB_URL_LOCAL } from "../config/config.service.js";

async function testDBConnection() {
    try {
        await connect(DB_URL_LOCAL);
        console.log("Connected to the database successfully.");
    }catch (error) {
        console.error("Failed to connect to the database:", error);
    }
} 
export default testDBConnection;