import { Router } from "express";
import {
  createHoliday,
  deleteHoliday,
  importHolidays,
  listHolidays,
} from "../controllers/holidays.controller";

export const holidaysRouter: Router = Router();

holidaysRouter.get("/", listHolidays);
holidaysRouter.post("/", createHoliday);
holidaysRouter.post("/import", importHolidays);
holidaysRouter.delete("/:date", deleteHoliday);
