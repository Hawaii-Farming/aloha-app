'use client';

import { useCallback } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSupabase } from '@aloha/supabase/hooks/use-supabase';
import { ImageUploader } from '@aloha/ui/image-uploader';
import { Trans } from '@aloha/ui/trans';

const AVATARS_BUCKET = 'account_image';

export function UpdateTeamAccountImage(props: {
  account: {
    id: string;
    name: string;
    pictureUrl: string | null;
  };
}) {
  const client = useSupabase();
  const { t } = useTranslation('teams');

  const createToaster = useCallback(
    (promise: () => Promise<unknown>) => {
      return toast.promise(promise, {
        success: t(`updateTeamSuccessMessage`),
        error: t(`updateTeamErrorMessage`),
        loading: t(`updateTeamLoadingMessage`),
      });
    },
    [t],
  );

  const onValueChange = useCallback(
    (file: File | null) => {
      const removeExistingStorageFile = () => {
        if (props.account.pictureUrl) {
          return (
            deleteProfilePhoto(client, props.account.pictureUrl) ??
            Promise.resolve()
          );
        }

        return Promise.resolve();
      };

      // org table doesn't have picture_url — store in Supabase storage only
      // Future: add profile_photo_url column to org table if needed
      if (file) {
        const promise = () =>
          removeExistingStorageFile().then(() =>
            uploadUserProfilePhoto(client, file, props.account.id),
          );

        createToaster(promise);
      } else {
        createToaster(() => removeExistingStorageFile());
      }
    },
    [client, createToaster, props],
  );

  return (
    <ImageUploader
      value={props.account.pictureUrl}
      onValueChange={onValueChange}
    >
      <div className={'flex flex-col space-y-1'}>
        <span className={'text-sm'}>
          <Trans i18nKey={'account:profilePictureHeading'} />
        </span>

        <span className={'text-xs'}>
          <Trans i18nKey={'account:profilePictureSubheading'} />
        </span>
      </div>
    </ImageUploader>
  );
}

function deleteProfilePhoto(client: SupabaseClient, url: string) {
  const bucket = client.storage.from(AVATARS_BUCKET);
  const fileName = url.split('/').pop()?.split('?')[0];

  if (!fileName) {
    return;
  }

  return bucket.remove([fileName]);
}

async function uploadUserProfilePhoto(
  client: SupabaseClient,
  photoFile: File,
  userId: string,
) {
  const bytes = await photoFile.arrayBuffer();
  const bucket = client.storage.from(AVATARS_BUCKET);
  const extension = photoFile.name.split('.').pop();
  const fileName = await getAvatarFileName(userId, extension);

  const result = await bucket.upload(fileName, bytes);

  if (!result.error) {
    return bucket.getPublicUrl(fileName).data.publicUrl;
  }

  throw result.error;
}

async function getAvatarFileName(
  userId: string,
  extension: string | undefined,
) {
  const { nanoid } = await import('nanoid');
  const uniqueId = nanoid(16);

  return `${userId}.${extension}?v=${uniqueId}`;
}
