'use server';
import { revalidatePath } from 'next/cache';

const endpoint = `${process.env.APIGW_HOST}/test_datasets`;

export async function deleteDataset(id: string) {
  try {
    const response = await fetch(`${endpoint}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData: { message: string } = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to delete test dataset',
      };
    }

    revalidatePath('/datasets');
    return { success: true, message: 'Dataset deleted successfully' };
  } catch (error) {
    console.log('error deleting dataset', error);
    return { success: false, error: 'Failed to delete test dataset' };
  }
}
