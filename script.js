// ==================== CONFIGURACIÓN ====================
const PRECIO_FIJO_MENSUAL = 9.60;
const API_URL = 'https://script.google.com/macros/s/AKfycbxEXwEihs912O6u6fwjSSs1u1ELnUhT9-_6K0k1Q3VHy8IzYoyYGYQLx1NYgVO7aKLO/exec';

// Variables globales
let chartInstance = null;
let allData = [];

// ==================== FUNCIONES DE CÁLCULO ====================
function calcularHorasBase() {
    const select = document.getElementById('tipoHorario');
    const tipo = select.value;
    const textoSeleccionado = select.options[select.selectedIndex].text;
    
    if (textoSeleccionado.includes('15:30')) {
        return 7.5;
    } else if (textoSeleccionado.includes('16:00')) {
        return 7;
    } else if (textoSeleccionado.includes('16:30')) {
        return 6.5;
    } else if (textoSeleccionado.includes('17:00')) {
        return 6;
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
    return 6;
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
    const select = document.getElementById('tipoHorario');
    const textoSeleccionado = select.options[select.selectedIndex].text;
    const tipo = select.value;
    
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

// ==================== FUNCIONES CON FETCH ====================

function guardarRegistro() {
    const fecha = document.getElementById('fechaInput').value;
    if (!fecha) {
        mostrarMensaje("❌ Selecciona una fecha", "error");
        return;
    }
    
    const { entrada, salida } = getEntradaSalidaTexto();
    const horasExtrasVal = parseFloat(document.getElementById('horasExtras').value) || 0;
    const precioHoraVal = parseFloat(document.getElementById('precioHora').value) || 0;
    const horasBase = calcularHorasBase();
    const horasTotales = horasBase + horasExtrasVal;
    const salarioDia = horasTotales * precioHoraVal;
    
    mostrarMensaje('💾 Guardando registro...', 'info');
    
    // Construir datos para enviar
    const params = new URLSearchParams();
    params.append('action', 'guardarRegistro');
    params.append('fecha', fecha);
    params.append('entrada', entrada);
    params.append('salida', salida);
    params.append('horasExtras', horasExtrasVal);
    params.append('horasTotales', horasTotales);
    params.append('salarioDia', salarioDia);
    
    fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
    })
    .then(() => {
        mostrarMensaje('✅ Registro guardado correctamente', 'success');
        document.getElementById('horasExtras').value = 0;
        actualizarCalculos();
        // Recargar datos después de guardar
        setTimeout(() => {
            cargarTodosLosDatos();
        }, 2000);
    })
    .catch(error => {
        mostrarMensaje('❌ Error al guardar: ' + error.message, 'error');
    });
}

function cargarTodosLosDatos() {
    mostrarMensaje('🔄 Cargando datos...', 'info');
    
    // Usar fetch para obtener datos
    const url = API_URL + '?action=getEmployeeData';
    
    fetch(url, {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error HTTP: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            allData = data.data || [];
            procesarDatos(data);
        } else {
            // Si no hay datos, mostrar mensaje
            if (data && data.message) {
                mostrarMensaje('ℹ️ ' + data.message, 'info');
            } else {
                mostrarMensaje('ℹ️ No hay datos disponibles', 'info');
            }
            // Crear estructura vacía
            procesarDatos({ data: [], success: true });
        }
    })
    .catch(error => {
        console.error('Error cargando datos:', error);
        mostrarMensaje('❌ Error al cargar datos: ' + error.message, 'error');
        // Mostrar tabla vacía
        procesarDatos({ data: [], success: true });
    });
}

function procesarDatos(response) {
    const data = response.data || [];
    allData = data;
    
    // Actualizar tabla de registros
    actualizarTablaRegistros(data);
    
    // Actualizar estadísticas
    actualizarEstadisticas(data);
    
    // Actualizar gráfico
    actualizarGrafico(data);
    
    // Actualizar historial
    actualizarHistorialMeses(data);
    
    if (data.length > 0) {
        mostrarMensaje('✅ Datos cargados correctamente (' + data.length + ' registros)', 'success');
    } else {
        mostrarMensaje('ℹ️ No hay registros disponibles', 'info');
    }
}

function actualizarTablaRegistros(data) {
    const tbody = document.querySelector("#registrosTable tbody");
    if (!tbody) return;
    
    if (data && data.length > 0) {
        tbody.innerHTML = data.map(function(item, index) {
            return `
                <tr>
                    <td>${item.date || ''}</td>
                    <td>${item.entryTime || ''}</td>
                    <td>${item.exitTime || ''}</td>
                    <td>${(item.extraHours || 0).toFixed(1)}</td>
                    <td>${(item.totalHours || 0).toFixed(2)}</td>
                    <td>${(item.dailySalary || 0).toFixed(2)}€</td>
                    <td class="action-icons">
                        <span class="edit-icon" onclick="editarRegistro(${index})" title="Editar">✏️</span>
                        <span class="delete-icon" onclick="eliminarRegistro(${index})" title="Eliminar">🗑️</span>
                    </td>
                </tr>
            `;
        }).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">📭 No hay registros aún. ¡Crea tu primer registro!</td></tr>';
    }
}

function actualizarEstadisticas(data) {
    const mesActual = document.getElementById('mesSelector').value || new Date().toISOString().slice(0, 7);
    let totalHorasMes = 0;
    let totalSalarioMes = 0;
    let totalValorFinalMes = 0;
    let diasMes = 0;
    
    if (data && data.length > 0) {
        data.forEach(function(item) {
            if (item.date) {
                const partes = item.date.split('/');
                if (partes.length === 3) {
                    const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);
                    const mesKey = fechaObj.getFullYear() + '-' + String(fechaObj.getMonth() + 1).padStart(2, '0');
                    if (mesKey === mesActual) {
                        totalHorasMes += item.totalHours || 0;
                        totalSalarioMes += item.dailySalary || 0;
                        totalValorFinalMes += (item.totalHours || 0) * PRECIO_FIJO_MENSUAL;
                        diasMes++;
                    }
                }
            }
        });
    }
    
    document.getElementById('horasMes').innerText = totalHorasMes.toFixed(2);
    document.getElementById('salarioMes').innerText = totalSalarioMes.toFixed(2) + " €";
    document.getElementById('diasMes').innerText = diasMes;
    document.getElementById('valorFinalMes').innerText = totalValorFinalMes.toFixed(2) + " €";
}

function actualizarHistorialMeses(data) {
    const tbodyHist = document.querySelector("#historialMesesTable tbody");
    if (!tbodyHist) return;
    
    const meses = {};
    
    if (data && data.length > 0) {
        data.forEach(function(item) {
            if (item.date) {
                const partes = item.date.split('/');
                if (partes.length === 3) {
                    const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);
                    const mesKey = fechaObj.getFullYear() + '-' + String(fechaObj.getMonth() + 1).padStart(2, '0');
                    const nombreMes = obtenerNombreMes(mesKey);
                    
                    if (!meses[mesKey]) {
                        meses[mesKey] = {
                            nombreMes: nombreMes,
                            totalHoras: 0,
                            totalSalario: 0,
                            totalValorFinal: 0,
                            dias: 0
                        };
                    }
                    
                    meses[mesKey].totalHoras += item.totalHours || 0;
                    meses[mesKey].totalSalario += item.dailySalary || 0;
                    meses[mesKey].totalValorFinal += (item.totalHours || 0) * PRECIO_FIJO_MENSUAL;
                    meses[mesKey].dias++;
                }
            }
        });
    }
    
    const keys = Object.keys(meses).sort().reverse();
    
    if (keys.length > 0) {
        tbodyHist.innerHTML = keys.map(key => {
            const m = meses[key];
            return `
                <tr>
                    <td><strong>${m.nombreMes}</strong></td>
                    <td>${m.totalHoras.toFixed(2)}</td>
                    <td>${m.totalSalario.toFixed(2)}€</td>
                    <td>${m.dias}</td>
                    <td style="font-weight: bold; color: #28a745;">${m.totalValorFinal.toFixed(2)}€</td>
                </tr>
            `;
        }).join('');
    } else {
        tbodyHist.innerHTML = '<tr><td colspan="5" style="text-align:center;">📭 Sin datos históricos</td></tr>';
    }
}

function actualizarGrafico(data) {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    
    const mesActual = document.getElementById('mesSelector').value || new Date().toISOString().slice(0, 7);
    let totalHorasMes = 0;
    let totalSalarioMes = 0;
    let totalValorFinalMes = 0;
    
    if (data && data.length > 0) {
        data.forEach(function(item) {
            if (item.date) {
                const partes = item.date.split('/');
                if (partes.length === 3) {
                    const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);
                    const mesKey = fechaObj.getFullYear() + '-' + String(fechaObj.getMonth() + 1).padStart(2, '0');
                    if (mesKey === mesActual) {
                        totalHorasMes += item.totalHours || 0;
                        totalSalarioMes += item.dailySalary || 0;
                        totalValorFinalMes += (item.totalHours || 0) * PRECIO_FIJO_MENSUAL;
                    }
                }
            }
        });
    }
    
    const ctx = document.getElementById('mesChart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Horas trabajadas', 'Salario (precio variable)', 'Valor final (9,60€/h)'],
            datasets: [{
                label: obtenerNombreMes(mesActual) || mesActual,
                data: [totalHorasMes, totalSalarioMes, totalValorFinalMes],
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
                        font: { size: 12, weight: 'bold' }
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
}

function obtenerNombreMes(mesKey) {
    if (!mesKey) return '';
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const partes = mesKey.split('-');
    if (partes.length === 2) {
        const mesNum = parseInt(partes[1]);
        return meses[mesNum - 1] + ' ' + partes[0];
    }
    return mesKey;
}

function mostrarMensaje(texto, tipo) {
    let messageDiv = document.getElementById('message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.className = 'message';
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
        } else {
            document.body.insertBefore(messageDiv, document.body.firstChild);
        }
    }
    
    messageDiv.textContent = texto;
    messageDiv.className = 'message ' + tipo;
    messageDiv.style.display = 'block';
    
    if (tipo === 'success' || tipo === 'info') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// ==================== EDITAR Y ELIMINAR ====================
function editarRegistro(index) {
    if (allData && allData[index]) {
        const registro = allData[index];
        mostrarMensaje('✏️ Editando registro del ' + registro.date + '. Funcionalidad en desarrollo.', 'info');
    } else {
        mostrarMensaje('✏️ Función de editar en desarrollo. Índice: ' + index, 'info');
    }
}

function eliminarRegistro(index) {
    if (confirm('¿Eliminar este registro?')) {
        mostrarMensaje('🗑️ Función de eliminar en desarrollo. Índice: ' + index, 'info');
    }
}

// ==================== EVENTOS E INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    const tipoHorario = document.getElementById('tipoHorario');
    const horasExtras = document.getElementById('horasExtras');
    const precioHora = document.getElementById('precioHora');
    const entradaCustom = document.getElementById('entradaCustom');
    const salidaCustom = document.getElementById('salidaCustom');
    const guardarBtn = document.getElementById('guardarBtn');
    const actualizarBtn = document.getElementById('actualizarEstadisticasBtn');
    const mesSelector = document.getElementById('mesSelector');
    
    if (tipoHorario) tipoHorario.addEventListener('change', function() { 
        toggleCustom(); 
        actualizarCalculos(); 
    });
    if (horasExtras) horasExtras.addEventListener('input', actualizarCalculos);
    if (precioHora) precioHora.addEventListener('input', actualizarCalculos);
    if (entradaCustom) entradaCustom.addEventListener('change', actualizarCalculos);
    if (salidaCustom) salidaCustom.addEventListener('change', actualizarCalculos);
    if (guardarBtn) guardarBtn.addEventListener('click', guardarRegistro);
    if (actualizarBtn) actualizarBtn.addEventListener('click', cargarTodosLosDatos);
    if (mesSelector) mesSelector.addEventListener('change', function() {
        cargarTodosLosDatos();
    });
    
    // Inicialización
    setFechaActual();
    toggleCustom();
    actualizarCalculos();
    
    // Cargar datos después de que todo esté listo
    setTimeout(function() {
        cargarTodosLosDatos();
    }, 500);
});
