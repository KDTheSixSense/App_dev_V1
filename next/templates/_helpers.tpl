{{/*
Define the common labels that will be applied to all resources.
*/}}
{{- define "next.labels" -}}
app.kubernetes.io/instance: {{ .Values.releaseName }}
app.kubernetes.io/name: {{ .Values.appName }}
helm.sh/chart: {{ include "next.chart" . }}
{{- end -}}

{{/*
Define PostgreSQL specific labels.
*/}}
{{- define "postgresql.labels" -}}
app.kubernetes.io/instance: {{ .Values.releaseName }}
app.kubernetes.io/name: postgresql
helm.sh/chart: {{ include "next.chart" . }}
{{- end -}}

{{/*
Define the selector labels for the PostgreSQL StatefulSet.
*/}}
{{- define "postgresql.selectorLabels" -}}
app.kubernetes.io/instance: {{ .Values.releaseName }}
app.kubernetes.io/name: postgresql
{{- end -}}

{{/*
Define the selector labels for the App Deployment.
*/}}
{{- define "next.selectorLabels" -}}
app.kubernetes.io/instance: {{ .Values.releaseName }}
app.kubernetes.io/name: {{ .Values.appName }}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "next.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}