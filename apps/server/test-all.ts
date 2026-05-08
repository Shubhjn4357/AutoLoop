import { db } from "@autoloop/db";
import * as all from "@autoloop/db";
console.log("db is:", db ? "Defined" : "Undefined");
console.log("All keys:", Object.keys(all));
