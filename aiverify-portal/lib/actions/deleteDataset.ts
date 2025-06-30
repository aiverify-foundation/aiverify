'use server';
import { revalidatePath } from 'next/cache';

const endpoint = `${process.env.APIGW_HOST}/test_datasets`;

export async function deleteDataset(id: string) {
  try {
    const response = await fetch(`${endpoint}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData: { detail?: string; message?: string } = await response.json();
      const errorMessage = errorData.detail || errorData.message || 'Failed to delete test dataset';
      return {
        success: false,
        error: errorMessage,
      };
    }

    revalidatePath('/datasets');
    return { success: true, message: 'Dataset deleted successfully' };
  } catch (error) {
    console.log('error deleting dataset', error);
    return { success: false, message: 'Failed to delete test dataset' };
  }
}
