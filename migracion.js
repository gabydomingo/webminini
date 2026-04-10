require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Si falla por permisos, usá la Service Role Key temporalmente
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para extraer los atributos ocultos
function extraerAtributos(row, getCol) {
    let location = '';
    let property_type = '';
    let bedrooms = 0;
    let bathrooms = 0;
    let environments = 0;
    let features = [];
    let currency = 'USD';

    for (let i = 1; i <= 20; i++) {
        const attrName = getCol(`Nombre del atributo ${i}`);
        const attrValue = getCol(`Valor(es) del atributo ${i}`);

        if (attrName && attrValue) {
            const name = attrName.trim();
            const val = attrValue.trim();

            if (name === 'Localidades') location = val;
            if (name === 'Propiedad') property_type = val;
            if (name === 'Dormitorios') bedrooms = parseInt(val) || 0;
            if (name === 'Baños') bathrooms = parseInt(val) || 0;
            if (name === 'Ambientes' || name === 'Cantidad de ambientes') environments = parseInt(val) || 0;
            if (name === 'Servicios' || name === 'Generales') features = val.split(',').map(s => s.trim());
            if (name === 'Alquiler en Pesos' || name.includes('Pesos')) currency = 'ARS';
        }
    }

    return { location, property_type, bedrooms, bathrooms, environments, features, currency };
}

async function migrarDatos() {
    const propiedades = [];
    let primeraFila = true;

    console.log("⏳ Leyendo el archivo CSV...");
    
    fs.createReadStream('prod-nini.csv')
        // Si al correrlo ves que las columnas se ven unidas por punto y coma, 
        // cambiá la línea de abajo por: .pipe(csv({ separator: ';' }))
        .pipe(csv({ separator: ',' })) 
        .on('data', (row) => {
            if (primeraFila) {
                console.log("🔍 Columnas detectadas en la primera fila:", Object.keys(row));
                primeraFila = false;
            }
            propiedades.push(row);
        })
        .on('end', async () => {
            console.log(`✅ CSV cargado. Procesando ${propiedades.length} propiedades...`);

            let insertadas = 0;
            let errores = 0;

            for (const row of propiedades) {
                // Función auxiliar súper segura para buscar columnas aunque tengan espacios invisibles
                const getCol = (name) => {
                    const key = Object.keys(row).find(k => k.trim().replace(/^\uFEFF/, '') === name);
                    return key ? row[key] : undefined;
                };

                const attrs = extraerAtributos(row, getCol);

                // Forzamos valores por defecto seguros para que Postgres no rechace nada
                const titulo = getCol('Nombre') || 'Sin título';
                const categorias = getCol('Categorías') || getCol('Categorias') || 'Venta';
                const precioBruto = getCol('Precio normal');

                const nuevaPropiedad = {
                    title: titulo,
                    description: getCol('Descripción') || getCol('Descripción corta') || '',
                    price: precioBruto ? parseFloat(precioBruto) : null,
                    operation_type: categorias, 
                    location: attrs.location || null,
                    property_type: attrs.property_type || null,
                    bedrooms: attrs.bedrooms,
                    bathrooms: attrs.bathrooms,
                    environments: attrs.environments,
                    features: attrs.features,
                    currency: attrs.currency,
                    status: 'disponible',
                    images: []
                };

                const { error } = await supabase
                    .from('properties')
                    .insert([nuevaPropiedad]);

                if (error) {
                    console.error(`❌ Error insertando "${titulo}":`, error.message);
                    errores++;
                } else {
                    insertadas++;
                }
            }
            
            console.log("\n==================================");
            console.log("🎉 MIGRACIÓN COMPLETADA");
            console.log(`✅ Propiedades insertadas: ${insertadas}`);
            console.log(`❌ Errores: ${errores}`);
            console.log("==================================");
        });
}

migrarDatos();