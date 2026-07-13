// ==================== CONFIGURACIÓN ====================
const PRECIO_FIJO_MENSUAL = 9.60;

// Variables globales
let chartInstance = null;

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

// ==================== FUNCIONES CON GOOGLE.SCRIPT.RUN ====================

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
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                mostrarMensaje('✅ ' + response.message, 'success');
                document.getElementById('horasExtras').value = 0;
                actualizarCalculos();
                cargarTodosLosDatos();
            } else {
                mostrarMensaje('❌ Error: ' + response.error, 'error');
            }
        })
        .withFailureHandler(function(error) {
            mostrarMensaje('❌ Error de conexión: ' + error.message, 'error');
        })
        .guardarRegistro(fecha, entrada, salida, horasExtrasVal, horasTotales, salarioDia);
}

function cargarTodosLosDatos() {
    mostrarMensaje('🔄 Cargando datos...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                procesarDatos(response);
            } else {
                mostrarMensaje('❌ Error al cargar datos: ' + (response.error || 'Error desconocido'), 'error');
            }
        })
        .withFailureHandler(function(error) {
            mostrarMensaje('❌ Error de conexión: ' + error.message, 'error');
        })
        .getEmployeeData();
}

function procesarDatos(response) {
    // Actualizar tabla de registros
    actualizarTablaRegistros(response.data || []);
    
    // Actualizar estadísticas
    actualizarEstadisticas(response.data || []);
    
    // Actualizar gráfico
    actualizarGrafico(response.data || []);
    
    // Actualizar historial
    actualizarHistorialMeses(response.data || []);
    
    mostrarMensaje('✅ Datos cargados correctamente', 'success');
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
        container.insertBefore(messageDiv, container.firstChild);
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

// ==================== EDITAR Y ELIMINAR (pendientes de implementar) ====================
function editarRegistro(index) {
    mostrarMensaje('✏️ Función de editar en desarrollo. Índice: ' + index, 'info');
}

function eliminarRegistro(index) {
    if (confirm('¿Eliminar este registro?')) {
        mostrarMensaje('🗑️ Función de eliminar en desarrollo. Índice: ' + index, 'info');
    }
}

// ==================== EVENTOS E INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    document.getElementById('tipoHorario').addEventListener('change', function() { 
        toggleCustom(); 
        actualizarCalculos(); 
    });
    document.getElementById('horasExtras').addEventListener('input', actualizarCalculos);
    document.getElementById('precioHora').addEventListener('input', actualizarCalculos);
    document.getElementById('entradaCustom').addEventListener('change', actualizarCalculos);
    document.getElementById('salidaCustom').addEventListener('change', actualizarCalculos);
    document.getElementById('guardarBtn').addEventListener('click', guardarRegistro);
    document.getElementById('actualizarEstadisticasBtn').addEventListener('click', cargarTodosLosDatos);
    document.getElementById('mesSelector').addEventListener('change', cargarTodosLosDatos);
    
    // Inicialización
    setFechaActual();
    toggleCustom();
    actualizarCalculos();
    
    // Cargar datos después de que todo esté listo
    setTimeout(function() {
        cargarTodosLosDatos();
    }, 500);
});