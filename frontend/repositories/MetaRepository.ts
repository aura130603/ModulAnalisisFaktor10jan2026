import db from "@/lib/db";
import { Meta } from "@/types/Meta";

const META_DB_ID = 'appMeta';

export class MetaRepository {
    async getMeta(): Promise<Meta | undefined> {
        return await db.metadata.get(META_DB_ID);
    }

    async saveMeta(meta: Meta): Promise<void> {
        await db.metadata.put({ ...meta, id: META_DB_ID });
    }

    async deleteMeta(): Promise<void> {
        await db.metadata.delete(META_DB_ID);
    }

    async clearMeta(): Promise<void> {
        await this.deleteMeta();
    }
}

export const metaRepository = new MetaRepository(); 