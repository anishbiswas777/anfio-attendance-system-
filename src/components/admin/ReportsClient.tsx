"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/components/providers/AppProviders";
import type { Department } from "@/types/database";

type ReportType = "daily" | "leave" | "late";

export function ReportsClient({
  departments,
  todayStr,
}: {
  departments: Department[];
  todayStr: string;
}) {
  const { toast } = useApp();
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState(`${todayStr.slice(0, 7)}-01`);
  const [endDate, setEndDate] = useState(todayStr);
  const [departmentId, setDepartmentId] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate,
        endDate,
        departmentId,
      });
      const res = await fetch(`/api/admin/reports/export?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Report failed",
          description: data.error || "Unable to generate report.",
          variant: "error",
        });
        return;
      }
      setRows(data.rows ?? []);
      toast({
        title: "Report generated",
        description: `${(data.rows ?? []).length} record(s) loaded.`,
        variant: "success",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anfio-${reportType}-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(
      wb,
      `anfio-${reportType}-report-${startDate}-to-${endDate}.xlsx`
    );
  };

  const exportPdf = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(
      `Anfio HRMS — ${reportType.toUpperCase()} Report (${startDate} to ${endDate})`,
      14,
      16
    );
    const headers = Object.keys(rows[0]);
    const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));
    autoTable(doc, {
      head: [headers],
      body,
      startY: 22,
      styles: { fontSize: 8 },
    });
    doc.save(`anfio-${reportType}-report-${startDate}-to-${endDate}.pdf`);
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reports & Exports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate authorized attendance, leave, and late reports and export to CSV,
          Excel, or PDF.
        </p>
      </div>

      <Card>
        <CardHeader title="Report Filters" />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="daily">Attendance Report</option>
                <option value="leave">Leave Report</option>
                <option value="late">Late Report</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={loadReport} loading={loading} className="w-full sm:w-auto">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={`Results (${rows.length})`}
          action={
            rows.length > 0 && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button size="sm" variant="outline" onClick={exportCsv} className="flex-1 sm:flex-none">
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={exportExcel} className="flex-1 sm:flex-none">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Excel
                </Button>
                <Button size="sm" variant="outline" onClick={exportPdf} className="flex-1 sm:flex-none">
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
            )
          }
        />
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              title="No report data loaded"
              description="Select your filters and click Generate Report."
            />
          ) : (
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-3 whitespace-nowrap">
                          {String(r[col] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
