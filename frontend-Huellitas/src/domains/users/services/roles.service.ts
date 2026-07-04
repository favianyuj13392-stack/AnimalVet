import { createCrudService } from "@/shared/lib/base.service";
import { Rol } from "../users.types";

export const rolesService = createCrudService<Rol>('/roles');
