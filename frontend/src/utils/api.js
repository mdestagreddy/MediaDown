const BACKEND_DOWN_MESSAGE =
  'Tidak dapat terhubung ke server backend. Pastikan backend berjalan di port 5000 (npm run dev).';

export async function fetchJson(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(BACKEND_DOWN_MESSAGE);
  }

  let data = null;

  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (data && data.error) {
      throw new Error(data.error);
    }
    throw new Error(`Server menolak permintaan (HTTP ${response.status}). ${BACKEND_DOWN_MESSAGE}`);
  }

  if (data === null) {
    throw new Error('Respons server kosong atau tidak valid. Pastikan backend berjalan di port 5000 (npm run dev).');
  }

  return data;
}
