import { useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';

import { Box, useSnackbar } from '@tradersclub/core-ui';

import LocalHeader from '@global-layouts/Default/LocalHeader';

import useDataLayer from '@global-hooks/useDataLayer';
import { useErrorMessage } from '@global-hooks/useErrorMessage';

import { useCreateIdea, useThreads, useUpdateIdea } from '@services/community/ideas';
import { createUseFeedIdeasKey, createUseThreadKey } from '@services/community/ideas/keys';
import { useCurrentUser } from '@services/community/user';

import { CategoryType, Idea } from '@entities/Idea';

import ModalExitForm from '@ideas/components/Form/ModalExitForm';
import IdeasAvatar from '@ideas/components/IdeasAvatar';
import useRedirectIdeas from '@ideas/hooks/useRedirectIdeas';
import { useCategoryIdeas } from '@ideas/stores/useCategoryIdeas';

import FreeIdea from './FreeIdea';
import TradeIdea from './TradeIdea';

const Form = () => {
  const { data: currentUser } = useCurrentUser();
  const { pushEvent } = useDataLayer();
  const queryClient = useQueryClient();
  const { query } = useRouter();
  const { openErrorMessage } = useErrorMessage();
  const setCategory = useCategoryIdeas((state) => state.setCategory);
  const { openSnackbar } = useSnackbar();
  const { redirect } = useRedirectIdeas();

  const { type, sequence } = query;
  const ideaId = query.ideaId as string;
  const isEdit = Boolean(ideaId);
  const isSequence = Boolean(sequence);

  const [openModalExitForm, setOpenModalExitForm] = useState<boolean>(false);
  const isSimplePublication = useMemo<boolean>(() => Boolean(type === `free`), [type]);

  const headerTitle = useMemo(() => {
    if (isSequence) {
      return `Adicionar sequência`;
    }

    if (isEdit) {
      return `Editar Idea`;
    }

    return `Adicionar Idea`;
  }, [isSequence, isEdit]);

  const { data, isInitialLoading } = useThreads(ideaId, {
    onError: (error) => openErrorMessage(error),
    enabled: isEdit && !isSequence,
  });

  const idea = useMemo<Idea | undefined>(() => (isEdit ? data : undefined), [data, isEdit]);

  const { mutate: createIdea } = useCreateIdea({
    onSuccess: (res) => {
      openSnackbar(`Publicação feita! Você pode editar ou excluir sua Idea em até 15min.`, {
        severity: `success`,
      });
      queryClient.resetQueries(createUseFeedIdeasKey(CategoryType.All));
      setCategory(CategoryType.All);
      redirect();
      pushEvent(`publicou_idea_publicacao_livre`, {
        id_do_autor: res.user_id,
        id_post: res.id,
        tipo_do_post: res.category === CategoryType.Publications ? `publicacao_livre` : `idea`,
      });
    },
    onError: (error) => openErrorMessage(error),
  });

  const { mutate: updateIdea } = useUpdateIdea({
    onSuccess: () => {
      openSnackbar(`Edição feita! Você pode editar ou excluir sua Idea em até 15min.`, {
        severity: `success`,
      });

      queryClient.resetQueries(createUseFeedIdeasKey(CategoryType.All));
      queryClient.invalidateQueries(createUseThreadKey(ideaId));
      if (idea?.idea_root) {
        queryClient.removeQueries(createUseThreadKey(idea?.idea_root));
      }
      setCategory(CategoryType.All);
      redirect();
    },
    onError: (error) => openErrorMessage(error),
  });

  if (isInitialLoading) {
    return null;
  }

  return (
    <Box
      backgroundColor="surface.base.fill"
      display="flex"
      flex="1"
      flexDirection="column"
      position="relative"
      overflow="auto"
      borderTop="1px solid"
      borderColor="surface.base.border"
    test-id="a57b321517">
      <LocalHeader
        title={headerTitle}
        displayBackButton={{ default: `block`, l: `block` }}
        onBack={() => setOpenModalExitForm(true)}
      test-id="c94f40cc20"/>
      <Box display="flex" alignItems="center" flexDirection="column" overflow="auto" test-id="c59237534c">
        <Box paddingX={16} test-id="ca73eb8d5d">
          <Box
            backgroundColor={{ default: `transparent`, m: `surface.base.fill` }}
            borderColor="surface.base.border"
            borderRadius="m"
            borderStyle="solid"
            borderWidth={{ default: 0, m: 1 }}
            marginY={16}
            marginX="auto"
            padding={{ default: 0, m: 32 }}
            width={{
              default: `100%`,
              xl: 1003,
            }}
          test-id="42e3089a05">
            {currentUser?.user && <IdeasAvatar user={currentUser?.user} size="md" test-id="b5539c7b86"/>}
            {isSimplePublication ? (
              <FreeIdea idea={idea} onCreate={createIdea} onUpdate={updateIdea} test-id="77673101af"/>
            ) : (
              <TradeIdea idea={idea} onCreate={createIdea} onUpdate={updateIdea} test-id="f35b2345cf"/>
            )}
          </Box>
        </Box>
      </Box>
      <ModalExitForm isOpen={openModalExitForm} onClose={() => setOpenModalExitForm(false)} test-id="cebf501917"/>
    </Box>
  );
};

export default Form;
