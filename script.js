// ==================== CONFIGURACIÓN ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDY3jxhPLFPWzWcNRQQ1fZuPjcyKE7QvuyhBzC76vb_T1_1oq9XYLbr0i09Sslx5BI/exec';
const PRECIO_FIJO_MENSUAL = 9.60;

// Variables globales
let chartInstance = null;
let registrosActuales = [];
let estadisticasActuales = null;

// ==================== FUNCIONES DE CÁLCULO ====================
function calcularHorasBase() {
    const select = document.getElementById('tipoHorario');
    const tipo = select.value;
    const textoSeleccionado = select.options[select.selectedIndex].text;
    
    // Detectar el tipo de horario por el texto
    if (textoSeleccionado.includes('15:30')) {
        return 7.5; // Horario especial
    } else if (textoSeleccionado.includes('16:00')) {
        return 7; // 16:00 - 23:00 = 7 horas
    } else if (textoSeleccionado.includes('16:30')) {
        return 6.5; // 16:30 - 23:00 = 6.5 horas
    } else if (textoSeleccionado.includes('17:00')) {
        return 6; // 17:00 - 23:00 = 6 horas
    } else if (tipo === 'custom') {
        const entrada = document.getElementById('entradaCustom').value;
        const salida = document.getElementById('salidaCustom').value;
        if (!entrada || !salida) return 0;
        const [startHour, startMin] = entrada.split(':').map(Number);
        const [endHour, endMin] = salida.split(':').map(Number);
        let horas = endHour - startHour + (endMin - startMin) / 60;
        if (horas < 0) horas += 24;
        return horas > 0 ? horas : 0;
    }
    return 6; // Valor por defecto
}

function actualizarCalculos() {
    const horasBase = calcularHorasBase();
    const extras = parseFloat(document.getElementById('horasExtras').value) || 0;
    const precio = parseFloat(document.getElementById('precioHora').value) || 0;
    const totalHoras = horasBase + extras;
    const salario = totalHoras * precio;
    const valorFinalDia = totalHoras * PRECIO_FIJO_MENSUAL;
    
    document.getElementById('horasBaseDisplay').innerText = horasBase.toFixed(2);
    document.getElementById('extrasDisplay').innerText = extras.toFixed(2);
    document.getElementById('totalHorasDisplay').innerText = totalHoras.toFixed(2);
    document.getElementById('salarioDisplay').innerText = salario.toFixed(2);
    
    // Actualizar el total del mes en tiempo real
    actualizarTotalMesEnTiempoReal();
}

function actualizarTotalMesEnTiempoReal() {
    const fechaSeleccionada = document.getElementById('fechaInput').value;
    if (!fechaSeleccionada) return;
    
    const mesSeleccionado = fechaSeleccionada.substring(0, 7);
    const mesActual = document.getElementById('mesSelector').value;
    
    // Solo actualizar si el mes seleccionado coincide con el mes del formulario
    if (mesSeleccionado !== mesActual) return;
    
    // Calcular el total del día actual
    const horasBase = calcularHorasBase();
    const extras = parseFloat(document.getElementById('horasExtras').value) || 0;
    const totalHorasDia = horasBase + extras;
    const valorFinalDia = totalHorasDia * PRECIO_FIJO_MENSUAL;
    const precio = parseFloat(document.getElementById('precioHora').value) || 0;
    const salarioDia = totalHorasDia * precio;
    
    // Buscar si ya existe un registro para hoy
    const registroExistente = registrosActuales.find(r => r.fecha === fechaSeleccionada && !r.esResumen);
    
    // Calcular total del mes
    let totalHorasMes = 0;
    let totalSalarioMes = 0;
    let totalValorFinalMes = 0;
    let diasMes = 0;
    
    registrosActuales.forEach(reg => {
        if (reg.fecha && reg.fecha.substring(0, 7) === mesSeleccionado && !reg.esResumen) {
            // Si es el día actual, usar los valores del formulario
            if (reg.fecha === fechaSeleccionada) {
                totalHorasMes += totalHorasDia;
                totalSalarioMes += salarioDia;
                totalValorFinalMes += valorFinalDia;
            } else {
                const horas = parseFloat(reg.horasTotales) || 0;
                totalHorasMes += horas;
                totalSalarioMes += parseFloat(reg.salario) || 0;
                totalValorFinalMes += horas * PRECIO_FIJO_MENSUAL;
            }
            diasMes++;
        }
    });
    
    // Si no hay registro para hoy, agregar el día actual
    if (!registroExistente && totalHorasDia > 0) {
        totalHorasMes += totalHorasDia;
        totalSalarioMes += salarioDia;
        totalValorFinalMes += valorFinalDia;
        diasMes++;
    }
    
    // Actualizar la interfaz
    document.getElementById('horasMes').innerText = totalHorasMes.toFixed(2);
    document.getElementById('salarioMes').innerText = totalSalarioMes.toFixed(2) + " €";
    document.getElementById('diasMes').innerText = diasMes;
    document.getElementById('valorFinalMes').innerText = totalValorFinalMes.toFixed(2) + " €";
    
    // Actualizar el gráfico
    actualizarGraficoTiempoReal(mesSeleccionado, totalHorasMes, totalSalarioMes, totalValorFinalMes);
}

function actualizarGraficoTiempoReal(mes, horas, salario, valorFinal) {
    if (chartInstance) {
        chartInstance.data.datasets[0].data = [horas, salario, valorFinal];
        chartInstance.data.datasets[0].label = obtenerNombreMes(mes);
        chartInstance.update();
    }
}

function toggleCustom() {
    const tipo = document.getElementById('tipoHorario').value;
    const customDiv = document.getElementById('customTimeGroup');
    customDiv.style.display = tipo === 'custom' ? 'flex' : 'none';
    actualizarCalculos();
}

function getEntradaSalidaTexto() {
    const select = document.getElementById('tipoHorario');
    const textoSeleccionado = select.options[select.selectedIndex].text;
    const tipo = select.value;
    
    // Detectar el tipo de horario por el texto
    if (textoSeleccionado.includes('15:30')) {
        return { entrada: "15:30", salida: "23:00" };
    } else if (textoSeleccionado.includes('16:00')) {
        return { entrada: "16:00", salida: "23:00" };
    } else if (textoSeleccionado.includes('16:30')) {
        return { entrada: "16:30", salida: "23:00" };
    } else if (textoSeleccionado.includes('17:00')) {
        return { entrada: "17:00", salida: "23:00" };
    } else if (tipo === 'custom') {
        return { 
            entrada: document.getElementById('entradaCustom').value, 
            salida: document.getElementById('salidaCustom').value 
        };
    }
    return { entrada: "17:00", salida: "23:00" };
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
            await cargarRegistrosRecientes();
            await cargarEstadisticasCompletas();
            // Resetear horas extras después de guardar
            document.getElementById('horasExtras').value = 0;
            actualizarCalculos();
        } else {
            alert("❌ Error: " + (result.error || "No se pudo guardar"));
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("❌ Error de conexión. Verifica que la URL de Apps Script sea correcta.");
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
    estadisticasActuales = data;
    
    if (data && !data.error) {
        const horasMes = data.horasMes || 0;
        const salarioMes = data.salarioMes || 0;
        const valorFinalMes = data.valorFinalMes || (horasMes * PRECIO_FIJO_MENSUAL);
        const diasMes = data.diasMes || 0;
        
        document.getElementById('horasMes').innerText = horasMes.toFixed(2);
        document.getElementById('salarioMes').innerText = salarioMes.toFixed(2) + " €";
        document.getElementById('diasMes').innerText = diasMes;
        document.getElementById('valorFinalMes').innerText = valorFinalMes.toFixed(2) + " €";
        
        // Historial de meses
        const historial = data.historialMeses || [];
        const tbodyHist = document.querySelector("#historialMesesTable tbody");
        if (historial.length > 0) {
            tbodyHist.innerHTML = historial.map(h => {
                const valorFinalHistorico = h.totalValorFinal || (h.totalHoras * PRECIO_FIJO_MENSUAL);
                return `
                    <tr>
                        <td><strong>${h.nombreMes || h.mes}</strong></td>
                        <td>${(h.totalHoras || 0).toFixed(2)}</td>
                        <td>${(h.totalSalario || 0).toFixed(2)}€</td>
                        <td>${h.dias || 0}</td>
                        <td style="font-weight: bold; color: #28a745;">${valorFinalHistorico.toFixed(2)}€</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbodyHist.innerHTML = '<tr><td colspan="5" style="text-align:center;">📭 Sin datos históricos</td></tr>';
        }
        
        // Gráfica
        if (chartInstance) chartInstance.destroy();
        const ctx = document.getElementById('mesChart').getContext('2d');
        const mesSeleccionado = document.getElementById('mesSelector').value;
        const nombreMes = obtenerNombreMes(mesSeleccionado);
        
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Horas trabajadas', 'Salario (precio variable)', 'Valor final (9,60€/h)'],
                datasets: [{
                    label: nombreMes || mesSeleccionado,
                    data: [
                        horasMes, 
                        salarioMes,
                        valorFinalMes
                    ],
                    backgroundColor: ['#2c7da0', '#61a5c2', '#28a745'],
                    borderColor: ['#1a5a7a', '#4a8aaa', '#1e7e34'],
                    borderWidth: 2
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: { 
                    legend: { 
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (context.parsed.y !== null) {
                                    if (context.dataIndex === 0) {
                                        label += ': ' + context.parsed.y.toFixed(2) + ' horas';
                                    } else {
                                        label += ': ' + context.parsed.y.toFixed(2) + ' €';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
        
        // Actualizar en tiempo real
        actualizarTotalMesEnTiempoReal();
    } else {
        console.warn("Error en datos o sin conexión");
        document.getElementById('horasMes').innerText = "0";
        document.getElementById('salarioMes').innerText = "0 €";
        document.getElementById('diasMes').innerText = "0";
        document.getElementById('valorFinalMes').innerText = "0.00 €";
        
        const tbodyHist = document.querySelector("#historialMesesTable tbody");
        tbodyHist.innerHTML = '<tr><td colspan="5" style="text-align:center;">⚠️ Error al cargar datos</td></tr>';
    }
}

async function cargarRegistrosRecientes() {
    const url = `${SCRIPT_URL}?action=getRegistros&t=${Date.now()}`;
    try {
        const resp = await fetch(url, { mode: 'cors' });
        const registros = await resp.json();
        registrosActuales = Array.isArray(registros) ? registros : [];
        
        const tbody = document.querySelector("#registrosTable tbody");
        
        // Filtrar solo registros reales (no resúmenes)
        const registrosReales = registrosActuales.filter(r => !r.esResumen);
        
        if (registrosReales.length > 0) {
            tbody.innerHTML = registrosReales.map(reg => `
                <tr>
                    <td>${reg.fecha || ''}</td>
                    <td>${reg.entrada || ''}</td>
                    <td>${reg.salida || ''}</td>
                    <td>${parseFloat(reg.horasExtras || 0).toFixed(1)}</td>
                    <td>${parseFloat(reg.horasTotales || 0).toFixed(2)}</td>
                    <td>${parseFloat(reg.salario || 0).toFixed(2)}€</td>
                    <td class="action-icons">
                        <span class="edit-icon" data-id="${reg.id}" data-fecha="${reg.fecha}" 
                              data-entrada="${reg.entrada}" data-salida="${reg.salida}" 
                              data-extras="${reg.horasExtras}">✏️</span>
                        <span class="delete-icon" data-id="${reg.id}">🗑️</span>
                    </td>
                </tr>
            `).join('');
            
            // Event listeners para editar
            document.querySelectorAll('.edit-icon').forEach(el => {
                el.addEventListener('click', () => editarRegistro(el.dataset));
            });
            // Event listeners para eliminar
            document.querySelectorAll('.delete-icon').forEach(el => {
                el.addEventListener('click', () => eliminarRegistro(el.dataset.id));
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">📭 No hay registros aún. ¡Crea tu primer registro!</td></tr>';
        }
        
        // Actualizar cálculos en tiempo real
        actualizarTotalMesEnTiempoReal();
    } catch (e) {
        console.error("Error registros", e);
        document.querySelector("#registrosTable tbody").innerHTML = '<tr><td colspan="7" style="text-align:center;">⚠️ Error al cargar datos</td></tr>';
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================
function obtenerNombreMes(mesKey) {
    if (!mesKey) return '';
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const partes = mesKey.split('-');
    if (partes.length === 2) {
        const mesNum = parseInt(partes[1]);
        return meses[mesNum - 1] + ' ' + partes[0];
    }
    return mesKey;
}

// ==================== EDITAR Y ELIMINAR ====================
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
            await cargarRegistrosRecientes();
            await cargarEstadisticasCompletas();
        } else {
            alert("❌ Error al editar: " + (result.error || "Error desconocido"));
        }
    } catch (error) {
        console.error(error);
        alert("❌ Error al editar");
    }
}

async function eliminarRegistro(id) {
    if (!confirm("¿Eliminar este registro?")) return;
    
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
            await cargarRegistrosRecientes();
            await cargarEstadisticasCompletas();
        } else {
            alert("❌ Error al eliminar: " + (result.error || "Error desconocido"));
        }
    } catch (error) {
        console.error(error);
        alert("❌ Error al eliminar");
    }
}

// ==================== EVENTOS E INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    document.getElementById('tipoHorario').addEventListener('change', () => { 
        toggleCustom(); 
        actualizarCalculos(); 
    });
    document.getElementById('horasExtras').addEventListener('input', actualizarCalculos);
    document.getElementById('precioHora').addEventListener('input', actualizarCalculos);
    document.getElementById('entradaCustom').addEventListener('change', actualizarCalculos);
    document.getElementById('salidaCustom').addEventListener('change', actualizarCalculos);
    document.getElementById('fechaInput').addEventListener('change', actualizarTotalMesEnTiempoReal);
    document.getElementById('guardarBtn').addEventListener('click', guardarRegistro);
    document.getElementById('actualizarEstadisticasBtn').addEventListener('click', () => { 
        cargarEstadisticasCompletas(); 
        cargarRegistrosRecientes(); 
    });
    document.getElementById('mesSelector').addEventListener('change', () => {
        cargarEstadisticasCompletas();
    });
    
    // Inicialización
    setFechaActual();
    toggleCustom();
    actualizarCalculos();
    
    // Cargar datos con un pequeño retraso para asegurar que todo está listo
    setTimeout(() => {
        cargarEstadisticasCompletas();
        cargarRegistrosRecientes();
    }, 100);
});