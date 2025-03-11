import { TestModel } from "@/app/models/utils/types";

export async function getTestModels(): Promise<TestModel[]> {
    const res = await fetch(`http://127.0.0.1:4000/test_models/`, { //extract to /lib/fetchapis/
      cache: 'no-store', //might no need this
    });
  
    if (!res.ok) {
      throw new Error('Failed to fetch test models');
    }
  
    return res.json();
  }
  