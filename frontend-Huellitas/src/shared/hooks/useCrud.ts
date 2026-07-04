import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Definimos la interfaz del servicio que espera el hook
interface CrudService<T> {
  getAll: () => Promise<T[]>;
  getOne: (id: string | number) => Promise<T>;
  create: (payload: any) => Promise<T>;
  update: (id: string | number, payload: any) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
}

export const useCrud = <T>(service: CrudService<T>, queryKey: string , options?: { enabled?: boolean; refetchInterval?: number }) => {
  const queryClient = useQueryClient();

  // 1. LEER (GET) - Maneja el estado de loading, error y la caché automáticamente
  const {
    data = [],
    isLoading: loading,
    isError: error,
    refetch
  } = useQuery<T[]>({
    queryKey: [queryKey],
    queryFn: () => service.getAll(),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled !== undefined ? options.enabled : true,
    refetchInterval: options?.refetchInterval,
  });

  // 2. CREAR (POST)
  const createMutation = useMutation({
    mutationFn: (newItem: any) => service.create(newItem),
    onSuccess: () => {
      // Magia pura: le decimos a React Query que la tabla cambió, 
      // y él solito hace el refetch de la grilla sin que tú programes nada más.
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Registro creado exitosamente");
    },
    onError: () => {
      // Nota: El error ya lo maneja el interceptor de Axios, 
      // pero puedes agregar lógica extra aquí si lo necesitas.
    }
  });

  // 3. ACTUALIZAR (PATCH/PUT)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => 
      service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Registro actualizado exitosamente");
    },
  });

  // 4. ELIMINAR (DELETE / SOFT DELETE)
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Registro eliminado exitosamente");
    },
  });

  return { 
    data, 
    loading, 
    error,
    refetch, // Por si alguna vez necesitas forzar la recarga con un botón
    createItem: createMutation.mutateAsync, 
    updateItem: updateMutation.mutateAsync, 
    deleteItem: deleteMutation.mutateAsync 
  };
};