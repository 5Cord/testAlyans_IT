import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { polygonApi, polygonKeys } from '@/entities/polygon';
import { ApiError } from '@/shared/api';

export function useCreatePolygon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: polygonApi.createPolygon,
    onSuccess: (result) => {
      if (result.status === 'created') {
        toast.success(`Полигон "${result.polygon.properties.name}" сохранён`);
        queryClient.invalidateQueries({ queryKey: polygonKeys.list() });
      } else {
        toast.error(
          `Полигон "${result.rejected.feature.properties.name}" отклонён: пересекается с существующими`,
        );
        queryClient.invalidateQueries({ queryKey: polygonKeys.rejected() });
      }
    },
    onError: (error) => {
      // текст ошибки бэка (например, "Территория с таким именем уже существует") показываем как есть
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Не удалось сохранить полигон. Попробуйте ещё раз',
      );
    },
  });
}
