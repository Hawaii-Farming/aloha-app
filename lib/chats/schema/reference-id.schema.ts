import { z } from 'zod';

const ID_LENGTH = 8;

export const ReferenceIdSchema = z.string().min(ID_LENGTH).max(ID_LENGTH);
