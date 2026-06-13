import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateTestInput, UpdateTestInput } from 'shared';
import {
  createTest,
  deleteTest,
  getQuestions,
  getTest,
  listTests,
  updateTest,
} from './api';

/** Query keys for the tests feature — keep them in one place. */
export const testKeys = {
  all: ['tests'] as const,
  detail: (id: string) => ['tests', id] as const,
  questions: (id: string) => ['tests', id, 'questions'] as const,
};

export function useTests() {
  return useQuery({ queryKey: testKeys.all, queryFn: listTests });
}

export function useTest(id: string) {
  return useQuery({ queryKey: testKeys.detail(id), queryFn: () => getTest(id) });
}

export function useQuestions(testId: string) {
  return useQuery({
    queryKey: testKeys.questions(testId),
    queryFn: () => getQuestions(testId),
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestInput) => createTest(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: testKeys.all }),
  });
}

export function useUpdateTest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTestInput) => updateTest(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: testKeys.all });
      void qc.invalidateQueries({ queryKey: testKeys.detail(id) });
    },
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testKeys.all }),
  });
}
