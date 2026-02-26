import { jsPDF } from 'jspdf';
import { Contrato, Personal } from '@/types';

export const generateContractPDF = (contrato: Contrato, personal?: Personal) => {
    const doc = new jsPDF();

    // Set colors and fonts
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);

    // Header
    doc.text('REPORTE DE CONTRATO LABORAL', 105, 30, { align: 'center' });
    doc.line(20, 35, 190, 35);

    // Body Info
    doc.setFontSize(14);
    doc.text('Información del Empleado', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Nombre: ${personal?.nombres || 'No especificado'}`, 25, 60);
    doc.text(`DNI: ${personal?.dni || 'No especificado'}`, 25, 67);
    doc.text(`Cargo: ${personal?.cargo || 'No especificado'}`, 25, 74);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Detalles del Contrato', 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Código ID: ${contrato.id_contrato}`, 25, 100);
    doc.text(`Tipo de Contrato: ${contrato.tipo_contrato.replace('_', ' ').toUpperCase()}`, 25, 107);
    doc.text(`Sueldo Base: S/ ${contrato.sueldo_base.toLocaleString()}`, 25, 114);
    doc.text(`Fecha de Inicio: ${contrato.fecha_inicio}`, 25, 121);
    doc.text(`Fecha de Fin: ${contrato.fecha_fin || 'Indeterminado'}`, 25, 128);
    doc.text(`Estado: ${contrato.estado.toUpperCase()}`, 25, 135);

    if (contrato.observaciones) {
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', 20, 150);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(contrato.observaciones, 160);
        doc.text(splitText, 25, 157);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
    doc.text('Sistema de Gestión Minera - Confidencial', 105, 285, { align: 'center' });

    // Save the PDF
    doc.save(`Contrato_${contrato.id_contrato}_${personal?.dni || 'SN'}.pdf`);
};
