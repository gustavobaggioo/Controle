export default function DashboardAgendaReparos() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard de Agenda de Reparos</h1>
          <p className="text-gray-600">
            Faça upload do Excel para gerar automaticamente a agenda de reparos e agendamentos.
          </p>
        </div>

        <Dashboard />
      </div>
    </div>
  )
}

import React, { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Calendar, Building2, Home, ClipboardList, Clock3, Filter } from 'lucide-react'

function Dashboard() {
  const [dados, setDados] = useState([])
  const [dataSelecionada, setDataSelecionada] = useState('')

  const tratarLocal = (valor) => {
    if (valor === 'U') return 'Unidade'
    if (valor === 'A') return 'Área Comum'
    if (valor === 'F') return 'FIPE'
    return valor || '-'
  }

  const formatarData = (valor) => {
    if (!valor) return ''

    const data = new Date(valor)

    if (isNaN(data)) return ''

    return data.toISOString().split('T')[0]
  }

  const formatarHorario = (valor) => {
    if (!valor) return '-'

    const data = new Date(valor)

    if (isNaN(data)) return '-'

    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatarDataExibicao = (valor) => {
    if (!valor) return '-'

    const data = new Date(valor)

    if (isNaN(data)) return '-'

    return data.toLocaleDateString('pt-BR')
  }

  const processarArquivo = async (evento) => {
    const arquivo = evento.target.files?.[0]

    if (!arquivo) return

    const buffer = await arquivo.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })

    const primeiraAba = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[primeiraAba]

    const json = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
    })

    const linhasTratadas = json.map((linha) => ({
      codigoOS: linha.ast_codigo || linha['Código OS'] || '',
      data: linha.asti_previsao_inicio_servico || linha.ast_os_data || '',
      apartamento: linha.ast_edificio || '',
      residencial: linha.emp_nome || '',
      status: linha.ast_status_descricao || '',
      local: tratarLocal(linha.ast_local),
      patologia: linha.asti_servico_descricao || '',
    }))

    const agrupado = {}

    linhasTratadas.forEach((item) => {
      const chave = `${item.codigoOS}_${formatarData(item.data)}`

      if (!agrupado[chave]) {
        agrupado[chave] = {
          ...item,
          patologias: [item.patologia],
        }
      } else {
        agrupado[chave].patologias.push(item.patologia)
      }
    })

    const resultadoFinal = Object.values(agrupado).map((item) => ({
      ...item,
      patologias: [...new Set(item.patologias)].join(' | '),
    }))

    setDados(resultadoFinal)

    if (resultadoFinal.length > 0) {
      setDataSelecionada(formatarData(resultadoFinal[0].data))
    }
  }

  const datasDisponiveis = useMemo(() => {
    const datas = [...new Set(dados.map((item) => formatarData(item.data)))]
      .filter(Boolean)
      .sort()

    return datas
  }, [dados])

  const dadosFiltrados = useMemo(() => {
    if (!dataSelecionada) return dados

    return dados.filter(
      (item) => formatarData(item.data) === dataSelecionada
    )
  }, [dados, dataSelecionada])

  return (
    <div>
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
          <div>
            <label className="font-semibold text-lg flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5" />
              Importar Excel
            </label>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={processarArquivo}
              className="border rounded-xl p-3 w-full bg-gray-50"
            />
          </div>

          <div>
            <label className="font-semibold text-lg flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5" />
              Filtrar Data
            </label>

            <select
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="border rounded-xl p-3 bg-gray-50 min-w-[220px]"
            >
              {datasDisponiveis.map((data) => (
                <option key={data} value={data}>
                  {new Date(data).toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CardInfo
          titulo="Total de OS"
          valor={dadosFiltrados.length}
          icone={<ClipboardList className="w-6 h-6" />}
        />

        <CardInfo
          titulo="Residenciais"
          valor={new Set(dadosFiltrados.map((i) => i.residencial)).size}
          icone={<Building2 className="w-6 h-6" />}
        />

        <CardInfo
          titulo="Apartamentos"
          valor={new Set(dadosFiltrados.map((i) => i.apartamento)).size}
          icone={<Home className="w-6 h-6" />}
        />

        <CardInfo
          titulo="Data Selecionada"
          valor={
            dataSelecionada
              ? new Date(dataSelecionada).toLocaleDateString('pt-BR')
              : '-'
          }
          icone={<Calendar className="w-6 h-6" />}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Agenda de Reparos</h2>
        </div>

        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4">Data</th>
                <th className="text-left p-4">Horário</th>
                <th className="text-left p-4">Apartamento</th>
                <th className="text-left p-4">Residencial</th>
                <th className="text-left p-4">Local</th>
                <th className="text-left p-4">Patologia</th>
                <th className="text-left p-4">Código OS</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {dadosFiltrados.map((item, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium">
                    {formatarDataExibicao(item.data)}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      {formatarHorario(item.data)}
                    </div>
                  </td>

                  <td className="p-4">{item.apartamento}</td>
                  <td className="p-4">{item.residencial}</td>
                  <td className="p-4">{item.local}</td>

                  <td className="p-4 max-w-[420px]">
                    <div className="text-sm whitespace-pre-wrap">
                      {item.patologias}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold">
                      {item.codigoOS}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {dadosFiltrados.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              Nenhuma OS encontrada para a data selecionada.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CardInfo({ titulo, valor, icone }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500 font-medium">{titulo}</div>
        <div>{icone}</div>
      </div>

      <div className="text-3xl font-bold break-words">{valor}</div>
    </div>
  )
}
