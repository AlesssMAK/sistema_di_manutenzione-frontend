import Modal from '@/components/UI/Modal/Modal';
import css from './DeletePlanPartModal.module.css';
import Button from '@/components/UI/Button/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DeletePlantPartRequest } from '@/types/plantPartType';
import { deletePlantPart } from '@/lib/api/plantsParts';

interface DeletePlanPartModalProps {
  onClose: () => void;
  plantId: string;
  plantPartId: string;
}

interface DeletePlanPart {
  plantId: string;
  plantPartId: string;
}

const DeletePlanPartModal = ({
  onClose,
  plantId,
  plantPartId,
}: DeletePlanPartModalProps) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ plantId, plantPartId }: DeletePlantPartRequest) =>
      deletePlantPart({ plantId, plantPartId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantParts'] });
      onClose();
    },
  });

  const handleDeletePlantPart = async ({
    plantId,
    plantPartId,
  }: DeletePlanPart) => {
    mutation.mutate({ plantId, plantPartId });
  };

  return (
    <Modal onClose={onClose}>
      <p className={css.text}>
        Sei sicuro di voler eliminare questa parte della macchina?
      </p>
      <div className={css.btn_container}>
        <Button className="button button--white" type="button" width="100%">
          Annulla
        </Button>
        <Button
          className={`${css.btn} button button--blue`}
          type="button"
          width="100%"
          onClick={() =>
            handleDeletePlantPart({
              plantId: plantId,
              plantPartId: plantPartId,
            })
          }
        >
          Elimina
        </Button>
      </div>
    </Modal>
  );
};

export default DeletePlanPartModal;
