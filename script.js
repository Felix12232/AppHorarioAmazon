// ==================== CONFIGURACIÓN ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDY3jxhPLFPWzWcNRQQ1fZuPjcyKE7QvuyhBzC76vb_T1_1oq9XYLbr0i09Sslx5BI/exec';

// Variables globales
let chartInstance = null;

// ==================== FUNCIONES DE CÁLCULO ====================
function calcularHorasBase() {
    const tipo = document.getElementById('tipoHorario').value;
    if (tipo === 'normal') return 6;
    if (tipo === 'especial') return 7.5;
    if (tipo === 'custom') {
        const entrada = document.getElementById('entradaCustom').value;
        const salida = document.getElementById('salidaCustom').value;
        if (!entrada || !salida) return 0;
        const [startHour, startMin] = entrada.split(':').map(Number);
        const [endHour, endMin] = salida.split(':').map(Number);
        let horas = endHour - startHour + (endMin - startMin) / 60;
        if (horas < 0) horas += 24;
        return horas > 0 ? horas : 0;
    }
    return 0;
}

function actualizarCalculos() {
    const horasBase = calcularHorasBase();
    const extras = parseFloat(document.getElementById('horasExtras').value) || 0;
    const precio = parseFloat(document.getElementById('precioHora').value) || 0;
    const totalHoras = horasBase + extras;
    const salario = totalHoras * precio;
    
    document.getElementById('horasBaseDisplay').innerText = horasBase.toFixed(2);
    document.getElementById('extrasDisplay').innerText = extras.toFixed(2);
    document.getElementById('totalHorasDisplay').innerText = totalHoras.toFixed(2);
    document.getElementById('salarioDisplay').innerText = salario.toFixed(2);
}

function toggleCustom() {
    const tipo = document.getElementById('tipoHorario').value;
    const customDiv = document.getElementById('customTimeGroup');
    customDiv.style.display = tipo === 'custom' ? 'flex' : 'none';
    actualizarCalculos();
}

function getEntradaSalidaTexto() {
    const tipo = document.getElementById('tipoHorario').value;
    if (tipo === 'normal') return { entrada: "17:00", salida: "23:00" };
    if (tipo === 'especial') return { entrada: "15:30", salida: "23:00" };
    return { 
        entrada: document.getElementById('entradaCustom').value, 
        salida: document.getElementById('salidaCustom').value 
    };
}

function setFechaActual() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('fechaInput').value = today;
}

// ==================== PETICIONES A APPS SCRIPT ====================
async function guardarRegistro() {
    const fecha = document.getElementById('fechaInput').value;
    if (!fecha) {
        alert("❌ Selecciona una fecha");
        return;
    }
    
    const { entrada, salida } = getEntradaSalidaTexto();
    const horasExtrasVal = parseFloat(document.getElementById('horasExtras').value) || 0;
    const precioHoraVal = parseFloat(document.getElementById('precioHora').value) || 0;
    const horasBase = calcularHorasBase();
    const horasTotales = horasBase + horasExtrasVal;
    const salarioDia = horasTotales * precioHoraVal;
    
    const payload = new URLSearchParams({
        action: "guardar",
        fecha: fecha,
        entrada: entrada,
        salida: salida,
        horasExtras: horasExtrasVal,
        horasTotales: horasTotales,
        precioHora: precioHoraVal,
        salario: salarioDia
    });
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            mode: 'cors',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload
        });
        
        const result = await response.json();
        if (result.success) {
            alert("✅ Registro guardado correctamente");
            cargarEstadisticasCompletas();
            cargarRegistrosRecientes();
        } else {
            alert("❌ Error: " + (result.error || "No se pudo guardar"));
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("❌ Error de conexión. Verifica que la URL de Apps Script sea correcta y esté desplegada correctamente.");
    }
}

async function obtenerDatos(mes = null) {
    if (!mes) {
        const hoy = new Date();
        mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('mesSelector').value = mes;
    }
    
    const url = `${SCRIPT_URL}?action=getStats&mes=${mes}&t=${Date.now()}`;
    try {
        const resp = await fetch(url, { mode: 'cors' });
        const data = await resp.json();
        return data;
    } catch (e) {
        console.warn("Error fetch stats", e);
        return { error: true, message: e.message };
    }
}

async function cargarEstadisticasCompletas() {
    const mesActual = document.getElementById('mesSelector').value;
    if (!mesActual) {
        const hoy = new Date();
        const mesDef = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('mesSelector').value = mesDef;
    }
    
    const data = await obtenerDatos(document.getElementById('mesSelector').value);
    
    if (data && !data.error) {
        document.getElementById('horasMes').innerText = (data.horasMes || 0).toFixed(2);
        document.getElementById('salarioMes').innerText = (data.salarioMes || 0).toFixed(2) + " €";
        document.getElementById('diasMes').innerText = data.diasMes || 0;
        
        // Historial de meses
        const historial = data.historialMeses || [];
        const tbodyHist = document.querySelector("#historialMesesTable tbody");
        if (historial.length) {
            tbodyHist.innerHTML = historial.map(h => `
                <tr>
                    <td>${h.mes}</td>
                    <td>${h.totalHoras.toFixed(2)}</td>
                    <td>${h.totalSalario.toFixed(2)}€</td>
                    <td>${h.dias}</td>
                </tr>
            `).join('');
        } else {
            tbodyHist.innerHTML = '<tr><td colspan="4">Sin datos históricos</td><td></td><td></td><td></td></tr>';
        }
        
        // Gráfica
        if (chartInstance) chartInstance.destroy();
        const ctx = document.getElementById('mesChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Horas trabajadas', `Salario (€)`],
                datasets: [{
                    label: `${document.getElementById('mesSelector').value}`,
                    data: [data.horasMes || 0, (data.salarioMes || 0)],
                    backgroundColor: ['#2c7da0', '#61a5c2']
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    } else {
        console.warn("Error en datos o sin conexión");
        document.getElementById('horasMes').innerText = "0";
        document.getElementById('salarioMes').innerText = "0 €";
        document.getElementById('diasMes').innerText = "0";
    }
}

async function cargarRegistrosRecientes() {
    const url = `${SCRIPT_URL}?action=getRegistros&t=${Date.now()}`;
    try {
        const resp = await fetch(url, { mode: 'cors' });
        const registros = await resp.json();
        const tbody = document.querySelector("#registrosTable tbody");
        
        if (registros && registros.length) {
            tbody.innerHTML = registros.map(reg => `
                <tr>
                    <td>${reg.fecha}</td><td>${reg.entrada}</td><td>${reg.salida}</td>
                    <td>${reg.horasExtras}</td><td>${reg.horasTotales}</td>
                    <td>${parseFloat(reg.salario).toFixed(2)}€</td>
                    <td class="action-icons">
                        <span class="edit-icon" data-id="${reg.id}" data-fecha="${reg.fecha}" 
                              data-entrada="${reg.entrada}" data-salida="${reg.salida}" 
                              data-extras="${reg.horasExtras}">✏️</span>
                        <span class="delete-icon" data-id="${reg.id}">🗑️</span>
                    </td>
                </tr>
            `).join('');
            
            document.querySelectorAll('.edit-icon').forEach(el => {
                el.addEventListener('click', () => editarRegistro(el.dataset));
            });
            document.querySelectorAll('.delete-icon').forEach(el => {
                el.addEventListener('click', () => eliminarRegistro(el.dataset.id));
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7">📭 No hay registros aún. ¡Crea tu primer registro!</td></tr>';
        }
    } catch (e) {
        console.error("Error registros", e);
        document.querySelector("#registrosTable tbody").innerHTML = '<tr><td colspan="7">⚠️ Error al cargar datos. Verifica la conexión con Google Sheets.</td></tr>';
    }
}

async function editarRegistro(datos) {
    const nuevaFecha = prompt("📅 Nueva fecha (YYYY-MM-DD):", datos.fecha);
    if (!nuevaFecha) return;
    const nuevaEntrada = prompt("🕒 Hora entrada (HH:MM):", datos.entrada);
    const nuevaSalida = prompt("🕒 Hora salida (HH:MM):", datos.salida);
    const nuevasExtras = parseFloat(prompt("➕ Horas extras:", datos.extras));
    if (isNaN(nuevasExtras)) return;
    
    let horasBaseCalc = 0;
    if (nuevaEntrada && nuevaSalida) {
        const [startHour, startMin] = nuevaEntrada.split(':').map(Number);
        const [endHour, endMin] = nuevaSalida.split(':').map(Number);
        horasBaseCalc = endHour - startHour + (endMin - startMin) / 60;
        if (horasBaseCalc < 0) horasBaseCalc += 24;
    }
    const totalHorasNuevas = horasBaseCalc + nuevasExtras;
    const precio = parseFloat(document.getElementById('precioHora').value) || 9.90;
    const salarioNuevo = totalHorasNuevas * precio;
    
    const payload = new URLSearchParams({
        action: "editar",
        id: datos.id,
        fecha: nuevaFecha,
        entrada: nuevaEntrada,
        salida: nuevaSalida,
        horasExtras: nuevasExtras,
        horasTotales: totalHorasNuevas,
        salario: salarioNuevo
    });
    
    try {
        const response = await fetch(SCRIPT_URL, { 
            method: "POST", 
            mode: 'cors',
            body: payload 
        });
        const result = await response.json();
        if (result.success) {
            alert("✅ Registro editado correctamente");
            cargarRegistrosRecientes();
            cargarEstadisticasCompletas();
        } else {
            alert("❌ Error al editar: " + result.error);
        }
    } catch (error) {
        console.error(error);
        alert("❌ Error al editar");
    }
}

async function eliminarRegistro(id) {
    if (confirm("¿Eliminar este registro?")) {
        const payload = new URLSearchParams({ 
            action: "eliminar", 
            id: id 
        });
        try {
            const response = await fetch(SCRIPT_URL, { 
                method: "POST", 
                mode: 'cors',
                body: payload 
            });
            const result = await response.json();
            if (result.success) {
                alert("✅ Registro eliminado");
                cargarRegistrosRecientes();
                cargarEstadisticasCompletas();
            } else {
                alert("❌ Error al eliminar");
            }
        } catch (error) {
            console.error(error);
            alert("❌ Error al eliminar");
        }
    }
}

// ==================== EVENTOS E INICIALIZACIÓN ====================
document.getElementById('tipoHorario').addEventListener('change', () => { 
    toggleCustom(); 
    actualizarCalculos(); 
});
document.getElementById('horasExtras').addEventListener('input', actualizarCalculos);
document.getElementById('precioHora').addEventListener('input', actualizarCalculos);
document.getElementById('entradaCustom').addEventListener('change', actualizarCalculos);
document.getElementById('salidaCustom').addEventListener('change', actualizarCalculos);
document.getElementById('guardarBtn').addEventListener('click', guardarRegistro);
document.getElementById('actualizarEstadisticasBtn').addEventListener('click', () => { 
    cargarEstadisticasCompletas(); 
    cargarRegistrosRecientes(); 
});

// Inicialización
setFechaActual();
toggleCustom();
actualizarCalculos();
cargarEstadisticasCompletas();
cargarRegistrosRecientes();
