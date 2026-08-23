import { Router } from "express";
import {
  deleteEntry,
  getEntry,
  importEntries,
  listEntries,
  upsertEntry,
} from "../controllers/entries.controller";

export const entriesRouter: Router = Router();

entriesRouter.get("/", listEntries);
entriesRouter.post("/import", importEntries);
entriesRouter.get("/:squadId/:date", getEntry);
entriesRouter.put("/:squadId/:date", upsertEntry);
entriesRouter.delete("/:squadId/:date", deleteEntry);
