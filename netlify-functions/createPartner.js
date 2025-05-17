const { createClient } = require('@supabase/supabase-js');
const Busboy = require('busboy');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: event.headers });
    const fields = {};
    let fileData = null;
    let fileName = null;
    let fileMime = null;

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const buffers = [];
      fileName = filename;
      fileMime = mimetype;

      file.on('data', (data) => {
        buffers.push(data);
      });

      file.on('end', () => {
        fileData = Buffer.concat(buffers);
      });
    });

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('finish', async () => {
      try {
        if (!fileData) {
          resolve({ statusCode: 400, body: JSON.stringify({ error: 'Arquivo de imagem não enviado' }) });
          return;
        }

        // Crie um nome único para o arquivo no storage
        const timestamp = Date.now();
        const filePath = `imagens/${timestamp}-${fileName}`;

        // Faz upload da imagem no Supabase Storage (bucket 'parceiros')
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('parceiros')
          .upload(filePath, fileData, {
            contentType: fileMime,
            upsert: false,
          });

        if (uploadError) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erro no upload da imagem: ' + uploadError.message }) });
          return;
        }

        // Gera URL pública da imagem
        const { publicURL, error: urlError } = supabase.storage
          .from('parceiros')
          .getPublicUrl(filePath);

        if (urlError) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erro ao gerar URL pública: ' + urlError.message }) });
          return;
        }

        // Insere parceiro no banco
        const { data: insertData, error: insertError } = await supabase
          .from('parceiros')
          .insert([{
            nome: fields.nome,
            email: fields.email,
            telefone: fields.telefone,
            endereco: fields.endereco,
            cnpj: fields.cnpj,
            imagem_url: publicURL,
          }]);

        if (insertError) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erro ao inserir parceiro: ' + insertError.message }) });
          return;
        }

        resolve({
          statusCode: 200,
          body: JSON.stringify({ message: 'Parceiro cadastrado com sucesso', data: insertData }),
        });
      } catch (err) {
        resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erro interno: ' + err.message }) });
      }
    });

    busboy.end(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
  });
};
