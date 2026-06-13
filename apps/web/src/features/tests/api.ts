import {
  questionListSchema,
  testListSchema,
  testSchema,
  uploadPreviewSchema,
  type CreateTestInput,
  type Question,
  type Test,
  type UpdateTestInput,
  type UploadPreview,
} from 'shared';
import { api } from '@/lib/api';

export async function listTests(): Promise<Test[]> {
  const { data } = await api.get('/tests');
  return testListSchema.parse(data);
}

export async function getTest(id: string): Promise<Test> {
  const { data } = await api.get(`/tests/${id}`);
  return testSchema.parse(data);
}

export async function createTest(input: CreateTestInput): Promise<Test> {
  const { data } = await api.post('/tests', input);
  return testSchema.parse(data);
}

export async function updateTest(
  id: string,
  input: UpdateTestInput,
): Promise<Test> {
  const { data } = await api.patch(`/tests/${id}`, input);
  return testSchema.parse(data);
}

export async function deleteTest(id: string): Promise<void> {
  await api.delete(`/tests/${id}`);
}

export async function getQuestions(testId: string): Promise<Question[]> {
  const { data } = await api.get(`/tests/${testId}/questions`);
  return questionListSchema.parse(data);
}

/** Upload a sheet for a dry-run preview (validation only, no DB write). */
export async function previewUpload(
  testId: string,
  file: File,
): Promise<UploadPreview> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(
    `/tests/${testId}/questions/upload/preview`,
    form,
  );
  return uploadPreviewSchema.parse(data);
}

/** Commit a sheet: replaces the test's question set. */
export async function commitUpload(
  testId: string,
  file: File,
): Promise<{ inserted: number }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(
    `/tests/${testId}/questions/upload/commit`,
    form,
  );
  return data as { inserted: number };
}
