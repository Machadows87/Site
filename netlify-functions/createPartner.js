const { createClient } = require('@supabase/supabase-js');
const { Buffer } = require('buffer');
const multipart = require('parse-multipart');

// Variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async (event) => {
  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const boundary = multipart.getBoundary(contentType);
    const body = Buffer.from(event.body, 'base64');
    const parts = multipart.Parse(body, boundary);

    const formData = {};
    let imagePart;

    for (const part of parts) {
      if (part.filename) {
        imagePart = part;
      } else {
        formData[part.name] = part.data.toString();
      }
    }

    if (imagePart) {
      // Nome único para a imagem
      const fileName = `${Date.now()}-${imagePart.filename}`;
      
      // Faz upload da imagem no bucket 'imagens'
      const { data: imageData, error: imageError } = await client.storage
        .from('imagens')
        .upload(fileName, imagePart.data, { contentType: imagePart.type });

      if (imageError) {
        return { statusCode: 400, body: JSON.stringify({ error: imageError.message }) };
      }

      // Obter URL público da imagem
      const { publicUrl } = client.storage.from('imagens').getPublicUrl(fileName);
      formData.imagem_url = publicUrl;
    }

    // Insere os dados do parceiro no Supabase
    const { data, error } = await client.from('parceiros').insert([formData]);

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
