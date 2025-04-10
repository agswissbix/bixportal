import axiosInstance from '@/utils/axiosInstance';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseFormData } from '@/lib/parseFormData';
import FormDataNode from 'form-data';
import fs from 'fs';

// Disabilita il body parser di Next.js per gestire file
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrftoken')?.value;
  const sessionId = cookieStore.get('sessionid')?.value;

  const contentType = request.headers.get('content-type') || '';

  let postData: any = {};
  let rawFormData: FormDataNode | null = null;

  try {
    if (contentType.includes('application/json')) {
      postData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseFormData(request);
      postData = fields;
      const singleValueFields: Record<string, any> = {};
      for (const [key, fieldValue] of Object.entries(fields)) {
        if (Array.isArray(fieldValue) && fieldValue.length === 1) {
          singleValueFields[key] = fieldValue[0];
        } else {
          singleValueFields[key] = fieldValue;
        }
      }
      postData = singleValueFields;
      rawFormData = new FormDataNode();

      // Aggiungi i campi testuali (gestione array)
      for (const [key, fieldValue] of Object.entries(postData)) {
        // se è un array di 1 elemento -> stringa
        let values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
        if (values.length === 1) {
          // valore singolo
          rawFormData.append(key, values[0]);
        } else {
          // multipli
          values.forEach((item) => {
            if (rawFormData) {
              rawFormData.append(key, item);
            }
          });
        }
      }

      // Aggiungi i file
      for (const [key, fileOrFiles] of Object.entries(files)) {
        const fileArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
        fileArray.forEach((f: any) => {
          if (f?.filepath) {
            if (rawFormData) {
              rawFormData.append(key, fs.createReadStream(f.filepath), {
                filename: f.originalFilename,
                contentType: f.mimetype,
              });
            }
          }
        });
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      postData = Object.fromEntries(formData.entries());

      rawFormData = new FormDataNode();
      for (const [key, value] of formData.entries()) {
        rawFormData.append(key, value as any);
      }
    } else {
      return NextResponse.json(
        { error: `Content-Type non supportato: ${contentType}` },
        { status: 415 }
      );
    }
  } catch (error) {
    console.error('Errore nel parsing del body:', error);
    return NextResponse.json(
      { error: 'Errore nel parsing del body. Assicurati che sia ben formato.' },
      { status: 400 }
    );
  }

  const { apiRoute, ...rest } = postData;

  if (!apiRoute) {
    return NextResponse.json(
      { error: 'apiRoute è obbligatorio nel body della richiesta.' },
      { status: 400 }
    );
  }

  let djangoUrl = '';
  switch (apiRoute) {
    case 'examplepost': djangoUrl = '/commonapp/examplepost/'; break;
    case 'get_sidebarmenu_items': djangoUrl = '/commonapp/get_sidebarmenu_items/'; break;
    case 'test_connection': djangoUrl = '/commonapp/test_connection/'; break;
    case 'test_connection_get_csrf': djangoUrl = '/commonapp/test_connection_get_csrf'; break;
    case 'test_connection_post': djangoUrl = '/commonapp/test_connection_post/'; break;
    case 'getCsrf': djangoUrl = '/commonapp/get_csrf'; break;
    case 'login': djangoUrl = '/auth/login/'; break;
    case 'checkAuth': djangoUrl = '/auth/user/'; break;
    case 'verify_2fa': djangoUrl = '/commonapp/verify_2fa/'; break;
    case 'changePassword': djangoUrl = '/commonapp/change_password/'; break;
    case 'get_shifts_and_volunteers_telefono':
      djangoUrl = '/customapp_telefonoamico/get_shifts_and_volunteers_telefono/'; break;
    case 'get_shifts_and_volunteers_chat':
      djangoUrl = '/customapp_telefonoamico/get_shifts_and_volunteers_chat/'; break;
    case 'get_volunteers_list': djangoUrl = '/customapp_telefonoamico/get_volunteers_list/'; break;
    case 'save_shift': djangoUrl = '/customapp_telefonoamico/save_shift/'; break;
    case 'delete_shift': djangoUrl = '/customapp_telefonoamico/delete_shift/'; break;
    case 'enable_2fa': djangoUrl = '/commonapp/enable_2fa/'; break;
    case 'getActiveServer': djangoUrl = '/commonapp/get_active_server/'; break;
    case 'winteler_wip_barcode_scan': djangoUrl = '/customapp_winteler/winteler_wip_barcode_scan/'; break;
    case 'delete_record': djangoUrl = '/commonapp/delete_record/'; break;
    case 'get_table_records': djangoUrl = '/commonapp/get_table_records/'; break;
    case 'set_column_order': djangoUrl = '/commonapp/set_column_order/'; break;
    case 'getPitservicePivotLavanderie': djangoUrl = '/commonapp/get_pitservice_pivot_lavanderia/'; break;
    case 'save_record_fields': djangoUrl = '/commonapp/save_record_fields/'; break;
    case 'get_table_views': djangoUrl = '/commonapp/get_table_views/'; break;
    case 'get_record_badge': djangoUrl = '/commonapp/get_record_badge/'; break;
    case 'get_record_card_fields': djangoUrl = '/commonapp/get_record_card_fields/'; break;
    case 'get_record_linked_tables': djangoUrl = '/commonapp/get_record_linked_tables/'; break;
    case 'prepara_email': djangoUrl = '/commonapp/prepara_email/'; break;
    case 'save_email': djangoUrl = '/commonapp/save_email/'; break;
    case 'get_input_linked': djangoUrl = '/commonapp/get_input_linked/'; break;
    case 'stampa_bollettini_test': djangoUrl = '/commonapp/stampa_bollettini_test/'; break;
    case 'stampa_bollettini': djangoUrl = '/commonapp/stampa_bollettini/'; break;
    case 'save_belotti_form_data': djangoUrl = '/commonapp/save_belotti_form_data/'; break;
    case 'get_form_data': djangoUrl = '/commonapp/get_form_data/'; break;

    default:
      return NextResponse.json(
        { error: `apiRoute ${apiRoute} non gestito.` },
        { status: 400 }
      );
  }

  try {
    const axiosConfig = {
      headers: {
        'X-CSRFToken': csrfToken ?? '',
        'Cookie': `sessionid=${sessionId ?? ''}; csrftoken=${csrfToken ?? ''}`,
        ...(rawFormData ? rawFormData.getHeaders() : {}),
      },
      withCredentials: true,
    };

    const payload = rawFormData ?? rest;
    const response = await axiosInstance.post(djangoUrl, payload, axiosConfig);

    const setCookieHeader = response.headers['set-cookie'] as string | string[] | undefined;
    const nextResponse = NextResponse.json(response.data, { status: 200 });

    if (Array.isArray(setCookieHeader)) {
      setCookieHeader.forEach((cookieValue) => {
        nextResponse.headers.append('Set-Cookie', cookieValue);
      });
    } else if (typeof setCookieHeader === 'string' && setCookieHeader.length > 0) {
      nextResponse.headers.set('Set-Cookie', setCookieHeader);
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Errore durante il proxy:', error);
    const status = error.response?.status || 500;
    const detail = error.response?.data?.detail || error.message || 'Errore generico.';
    return NextResponse.json({ error: detail }, { status });
  }
}
