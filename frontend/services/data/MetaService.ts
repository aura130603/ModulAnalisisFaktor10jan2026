import { metaRepository } from "@/repositories/MetaRepository";
import { Meta } from "@/types/Meta";

export class MetaService {
    async loadMeta(): Promise<Meta | undefined> {
        return await metaRepository.getMeta();
    }

    async saveMeta(meta: Meta): Promise<void> {
        await metaRepository.saveMeta(meta);
    }

    async resetMeta(): Promise<void> {
        await metaRepository.clearMeta();
    }
}

const metaService = new MetaService();
export default metaService; 