import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import {
    carregarCastracoes,
    criarCastracao,
    atualizarCastracao,
    excluirCastracao,
    selecionarCastracao
} from '../../store/castracoeSlice';
import { Castracao, CastracaoCreate, CastracaoUpdate } from '../../api/castracoeApi';
import { CastracoesList, CastracaoOrdenacaoCampo, OrdenacaoDirecao } from './CastracoesList';
import { CastracaoForm } from './CastracaoForm';
import { CastracaoDeleteModal } from './CastracaoDeleteModal';
import { Paginacao } from '../common/Paginacao';

const normalizarTexto = (valor?: string | null): string => {
    return (valor ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const obterDataIso = (data: string): string => {
    if (!data) {
        return '';
    }

    return data.split('T')[0];
};

const formatarDataBr = (data: string): string => {
    const dataIso = obterDataIso(data);

    if (!dataIso) {
        return '';
    }

    const [ano, mes, dia] = dataIso.split('-');

    if (!ano || !mes || !dia) {
        return data;
    }

    return `${dia}/${mes}/${ano}`;
};

const formatarValorBr = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const escaparHtml = (valor: string): string => {
    return valor
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const obterDescricaoPeriodo = (dataInicio: string, dataFim: string): string => {
    if (dataInicio && dataFim) {
        return `${formatarDataBr(dataInicio)} a ${formatarDataBr(dataFim)}`;
    }

    if (dataInicio) {
        return `A partir de ${formatarDataBr(dataInicio)}`;
    }

    if (dataFim) {
        return `Até ${formatarDataBr(dataFim)}`;
    }

    return 'Todos os registros';
};

const dentroDoPeriodo = (data: string, inicio: string, fim: string): boolean => {
    const dataIso = obterDataIso(data);

    if (!dataIso) {
        return false;
    }

    if (inicio && dataIso < inicio) {
        return false;
    }

    if (fim && dataIso > fim) {
        return false;
    }

    return true;
};

const obterValorOrdenacao = (castracao: Castracao, campo: CastracaoOrdenacaoCampo): string | number => {
    switch (campo) {
        case 'data':
            return obterDataIso(castracao.dataCastracao);
        case 'animal':
            return normalizarTexto(castracao.nomeAnimal);
        case 'clinica':
            return normalizarTexto(castracao.nomeClinica);
        case 'valor':
            return castracao.valor ?? 0;
        default:
            return obterDataIso(castracao.dataCastracao);
    }
};

export const CastracoesPa: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado } = useSelector(
        (state: RootState) => state.castracoes
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    const [pesquisa, setPesquisa] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [ordenarPor, setOrdenarPor] = useState<CastracaoOrdenacaoCampo>('data');
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoDirecao>('desc');

    useEffect(() => {
        dispatch(carregarCastracoes());
    }, [dispatch]);

    const castracoesFiltradasOrdenadas = useMemo(() => {
        const termo = normalizarTexto(pesquisa);

        const filtradas = itens.filter(castracao => {
            const textoBusca = [
                castracao.nomeAnimal,
                castracao.nomeClinica,
                castracao.observacoes
            ]
                .map(normalizarTexto)
                .join(' ');

            const atendePesquisa = !termo || textoBusca.includes(termo);
            const atendePeriodo = dentroDoPeriodo(castracao.dataCastracao, dataInicio, dataFim);

            return atendePesquisa && atendePeriodo;
        });

        return [...filtradas].sort((a, b) => {
            const valorA = obterValorOrdenacao(a, ordenarPor);
            const valorB = obterValorOrdenacao(b, ordenarPor);

            if (typeof valorA === 'number' && typeof valorB === 'number') {
                return direcaoOrdenacao === 'asc'
                    ? valorA - valorB
                    : valorB - valorA;
            }

            const comparacao = String(valorA).localeCompare(String(valorB), 'pt-BR', {
                numeric: true,
                sensitivity: 'base'
            });

            return direcaoOrdenacao === 'asc' ? comparacao : comparacao * -1;
        });
    }, [itens, pesquisa, dataInicio, dataFim, ordenarPor, direcaoOrdenacao]);

    const totalPaginas = Math.max(1, Math.ceil(castracoesFiltradasOrdenadas.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    useEffect(() => {
        setPagina(1);
    }, [pesquisa, dataInicio, dataFim, ordenarPor, direcaoOrdenacao]);

    const castracoesPaginadas = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return castracoesFiltradasOrdenadas.slice(inicio, inicio + tamanhoPagina);
    }, [castracoesFiltradasOrdenadas, pagina, tamanhoPagina]);

    const totalValorFiltrado = useMemo(() => {
        return castracoesFiltradasOrdenadas.reduce((total, castracao) => {
            return total + (Number(castracao.valor) || 0);
        }, 0);
    }, [castracoesFiltradasOrdenadas]);

    const gerarTabelaRelatorioHtml = (): string => {
        const periodo = obterDescricaoPeriodo(dataInicio, dataFim);

        const linhas = castracoesFiltradasOrdenadas.map(castracao => `
            <tr>
                <td>${escaparHtml(formatarDataBr(castracao.dataCastracao))}</td>
                <td>${escaparHtml(castracao.nomeAnimal || '')}</td>
                <td>${escaparHtml(castracao.nomeClinica || '')}</td>
                <td style="text-align: right;">R$ ${escaparHtml(formatarValorBr(Number(castracao.valor) || 0))}</td>
                <td>${escaparHtml(castracao.observacoes || '')}</td>
            </tr>
        `).join('');

        return `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Relatório de Castrações</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            font-size: 12px;
                            color: #222;
                        }

                        h1 {
                            font-size: 20px;
                            margin-bottom: 4px;
                        }

                        .resumo {
                            margin-bottom: 16px;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }

                        th, td {
                            border: 1px solid #999;
                            padding: 6px;
                        }

                        th {
                            background: #e9ecef;
                            text-align: left;
                        }

                        tfoot td {
                            font-weight: bold;
                            background: #f8f9fa;
                        }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Castrações</h1>
                    <div class="resumo">
                        <div><strong>Período:</strong> ${escaparHtml(periodo)}</div>
                        <div><strong>Pesquisa:</strong> ${escaparHtml(pesquisa || 'Todos os registros')}</div>
                        <div><strong>Total de castrações:</strong> ${castracoesFiltradasOrdenadas.length}</div>
                        <div><strong>Valor total:</strong> R$ ${escaparHtml(formatarValorBr(totalValorFiltrado))}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Pet</th>
                                <th>Clínica</th>
                                <th>Valor</th>
                                <th>Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas || '<tr><td colspan="5">Nenhum registro encontrado.</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3">Total</td>
                                <td style="text-align: right;">R$ ${escaparHtml(formatarValorBr(totalValorFiltrado))}</td>
                                <td>${castracoesFiltradasOrdenadas.length} registro(s)</td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
            </html>
        `;
    };

    const exportarExcel = () => {
        const periodo = obterDescricaoPeriodo(dataInicio, dataFim);
        const dataArquivo = new Date().toISOString().slice(0, 10);

        const dados = [
            ['Relatório de Castrações', '', '', '', ''],
            [`Período: ${periodo}`, '', '', '', ''],
            [`Pesquisa: ${pesquisa || 'Todos os registros'}`, '', '', '', ''],
            [`Total de castrações: ${castracoesFiltradasOrdenadas.length}`, '', '', '', ''],
            [`Valor total: R$ ${formatarValorBr(totalValorFiltrado)}`, '', '', '', ''],
            [],
            ['Data', 'Pet', 'Clínica', 'Valor', 'Observações'],
            ...castracoesFiltradasOrdenadas.map(castracao => [
                formatarDataBr(castracao.dataCastracao),
                castracao.nomeAnimal || '',
                castracao.nomeClinica || '',
                Number(castracao.valor) || 0,
                castracao.observacoes || ''
            ]),
            [],
            ['Total', '', '', totalValorFiltrado, `${castracoesFiltradasOrdenadas.length} registro(s)`]
        ];

        const planilha = XLSX.utils.aoa_to_sheet(dados);

        planilha['!cols'] = [
            { wch: 14 },
            { wch: 28 },
            { wch: 34 },
            { wch: 16 },
            { wch: 50 }
        ];

        planilha['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }
        ];

        const totalLinhas = dados.length;
        const linhaCabecalho = 6;
        const linhaTotal = totalLinhas - 1;

        planilha['!autofilter'] = {
            ref: `A${linhaCabecalho + 1}:E${linhaTotal - 1}`
        };

        const bordaFina = {
            top: { style: 'thin', color: { rgb: 'BFBFBF' } },
            bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
            left: { style: 'thin', color: { rgb: 'BFBFBF' } },
            right: { style: 'thin', color: { rgb: 'BFBFBF' } }
        };

        const estiloTitulo = {
            font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '5AA5B0' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        const estiloResumo = {
            font: { bold: true, color: { rgb: '1F2933' } },
            fill: { fgColor: { rgb: 'EAF6F8' } },
            alignment: { vertical: 'center' }
        };

        const estiloCabecalho = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2E5961' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: bordaFina
        };

        const estiloCelula = {
            border: bordaFina,
            alignment: { vertical: 'center' }
        };

        const estiloMoeda = {
            border: bordaFina,
            alignment: { horizontal: 'right', vertical: 'center' },
            numFmt: 'R$ #,##0.00'
        };

        const estiloTotal = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'D9EDEF' } },
            border: bordaFina,
            alignment: { vertical: 'center' }
        };

        const estiloTotalMoeda = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'D9EDEF' } },
            border: bordaFina,
            alignment: { horizontal: 'right', vertical: 'center' },
            numFmt: 'R$ #,##0.00'
        };

        for (let linha = 0; linha < totalLinhas; linha++) {
            for (let coluna = 0; coluna < 5; coluna++) {
                const endereco = XLSX.utils.encode_cell({ r: linha, c: coluna });

                if (!planilha[endereco]) {
                    planilha[endereco] = { t: 's', v: '' };
                }

                if (linha === 0) {
                    planilha[endereco].s = estiloTitulo;
                    continue;
                }

                if (linha >= 1 && linha <= 4) {
                    planilha[endereco].s = estiloResumo;
                    continue;
                }

                if (linha === linhaCabecalho) {
                    planilha[endereco].s = estiloCabecalho;
                    continue;
                }

                if (linha === linhaTotal) {
                    planilha[endereco].s = coluna === 3 ? estiloTotalMoeda : estiloTotal;
                    continue;
                }

                if (linha > linhaCabecalho && linha < linhaTotal - 1) {
                    planilha[endereco].s = coluna === 3 ? estiloMoeda : estiloCelula;
                }
            }
        }

        const range = XLSX.utils.decode_range(planilha['!ref'] || 'A1:E1');

        for (let linha = linhaCabecalho + 1; linha <= linhaTotal; linha++) {
            const valorCell = XLSX.utils.encode_cell({ r: linha, c: 3 });

            if (planilha[valorCell]) {
                planilha[valorCell].t = 'n';
                planilha[valorCell].z = 'R$ #,##0.00';
            }
        }

        planilha['!ref'] = XLSX.utils.encode_range(range);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, planilha, 'Castrações');
        XLSX.writeFile(workbook, `relatorio-castracoes-${dataArquivo}.xlsx`);
    };

    const imprimirRelatorio = () => {
        const html = gerarTabelaRelatorioHtml();
        const janela = window.open('', '_blank', 'width=1024,height=768');

        if (!janela) {
            window.alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está ativo.');
            return;
        }

        janela.document.open();
        janela.document.write(html);
        janela.document.close();
        janela.focus();

        setTimeout(() => {
            janela.print();
        }, 300);
    };

    const handleNovo = () => {
        dispatch(selecionarCastracao(null));
        setModoEdicao(false);
        setShowFormModal(true);
    };

    const handleEditar = (castracao: Castracao) => {
        dispatch(selecionarCastracao(castracao));
        setModoEdicao(true);
        setShowFormModal(true);
    };

    const handleSalvar = async (dados: CastracaoCreate | CastracaoUpdate) => {
        if ('id' in dados && dados.id > 0) {
            await dispatch(atualizarCastracao(dados as CastracaoUpdate));
        } else {
            await dispatch(criarCastracao(dados as CastracaoCreate));
            setPagina(1);
        }

        setShowFormModal(false);
    };

    const handleCancelar = () => {
        setShowFormModal(false);
    };

    const handleConfirmarExcluir = async () => {
        if (idParaExcluir !== null) {
            await dispatch(excluirCastracao(idParaExcluir));
            setIdParaExcluir(null);
        }
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    const handleOrdenar = (campo: CastracaoOrdenacaoCampo) => {
        if (ordenarPor === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
            return;
        }

        setOrdenarPor(campo);
        setDirecaoOrdenacao(campo === 'data' ? 'desc' : 'asc');
    };

    const limparFiltros = () => {
        setPesquisa('');
        setDataInicio('');
        setDataFim('');
        setOrdenarPor('data');
        setDirecaoOrdenacao('desc');
        setPagina(1);
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div>
                        <h2 className="h4 mb-0">Lista de Castrações</h2>
                        <small className="text-muted">
                            {castracoesFiltradasOrdenadas.length} de {itens.length} castrações exibidas.
                        </small>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Nova Castração
                    </button>
                </div>

                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-5">
                                <label className="form-label">Pesquisar</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={pesquisa}
                                    onChange={(e) => setPesquisa(e.target.value)}
                                    placeholder="Pet, clínica ou observações"
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Data inicial</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Data final</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                />
                            </div>

                            <div className="col-md-3 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    type="button"
                                    onClick={limparFiltros}
                                >
                                    Limpar
                                </button>
                            </div>

                            <div className="col-12 d-flex justify-content-end gap-2 mt-2 flex-wrap">
                                <button
                                    className="btn btn-outline-success btn-sm"
                                    type="button"
                                    onClick={exportarExcel}
                                    disabled={castracoesFiltradasOrdenadas.length === 0}
                                >
                                    Exportar Excel
                                </button>

                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    type="button"
                                    onClick={imprimirRelatorio}
                                    disabled={castracoesFiltradasOrdenadas.length === 0}
                                >
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                {castracoesFiltradasOrdenadas.length > 0 && (
                    <div className="alert alert-light border d-flex justify-content-between flex-wrap gap-2">
                        <span>
                            <strong>Total de castrações:</strong> {castracoesFiltradasOrdenadas.length}
                        </span>
                        <span>
                            <strong>Valor total:</strong> R$ {formatarValorBr(totalValorFiltrado)}
                        </span>
                    </div>
                )}

                <CastracoesList
                    castracoes={castracoesPaginadas}
                    onEditar={handleEditar}
                    onExcluir={(id) => setIdParaExcluir(id)}
                    ordenarPor={ordenarPor}
                    direcaoOrdenacao={direcaoOrdenacao}
                    onOrdenar={handleOrdenar}
                />

                {castracoesFiltradasOrdenadas.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={castracoesFiltradasOrdenadas.length}
                        onMudarPagina={setPagina}
                        onMudarTamanhoPagina={handleMudarTamanhoPagina}
                    />
                )}
            </div>

            {showFormModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modoEdicao && selecionado ? 'Editar Castração' : 'Nova Castração'}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCancelar}></button>
                            </div>
                            <div className="modal-body">
                                <CastracaoForm
                                    castracao={selecionado || undefined}
                                    onSubmit={handleSalvar}
                                    onCancel={handleCancelar}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CastracaoDeleteModal
                id={idParaExcluir}
                onCancel={() => setIdParaExcluir(null)}
                onConfirm={handleConfirmarExcluir}
            />
        </div>
    );
};
