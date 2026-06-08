import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import {
    carregarAnimais,
    criarAnimal,
    atualizarAnimal,
    excluirAnimal,
    selecionarAnimal,
    limparConfirmacaoExclusaoAnimal
} from '../../store/animaisSlice';
import { Animal, AnimalCreate, AnimalUpdate } from '../../api/animaisApi';
import { AnimaisList, AnimalOrdenacaoCampo, OrdenacaoDirecao } from './AnimaisList';
import { AnimalForm } from './AnimalForm';
import { AnimalDeleteModal } from './AnimalDeleteModal';
import { Paginacao } from '../common/Paginacao';

const normalizarTexto = (valor?: string | null): string => {
    return (valor ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const obterValorOrdenacao = (animal: Animal, campo: AnimalOrdenacaoCampo): string | number => {
    switch (campo) {
        case 'nome':
            return normalizarTexto(animal.nome);
        case 'especie':
            return normalizarTexto(animal.especie);
        case 'raca':
            return normalizarTexto(animal.raca);
        case 'sexo':
            return normalizarTexto(animal.sexo);
        case 'idade':
            return animal.idade ?? 0;
        case 'peso':
            return animal.peso ?? 0;
        case 'tutor':
            return normalizarTexto(animal.tutor?.nome);
        case 'castrado':
            return animal.ehCastrado ? 1 : 0;
        default:
            return normalizarTexto(animal.nome);
    }
};

export const AnimaisPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { itens, carregando, erro, selecionado, confirmacaoExclusao } = useSelector(
        (state: RootState) => state.animais
    );

    const [modoEdicao, setModoEdicao] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [tamanhoPagina, setTamanhoPagina] = useState(10);

    const [pesquisa, setPesquisa] = useState('');
    const [filtroEspecie, setFiltroEspecie] = useState('');
    const [filtroCastrado, setFiltroCastrado] = useState('');
    const [ordenarPor, setOrdenarPor] = useState<AnimalOrdenacaoCampo>('nome');
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoDirecao>('asc');

    useEffect(() => {
        dispatch(carregarAnimais());
    }, [dispatch]);

    const animaisFiltradosOrdenados = useMemo(() => {
        const termo = normalizarTexto(pesquisa);

        const filtrados = itens.filter(animal => {
            const textoBusca = [
		animal.nome,
    		animal.tutor?.nome
	]
    		.map(normalizarTexto)
    		.join(' ');
            const atendePesquisa = !termo || textoBusca.includes(termo);
            const atendeEspecie = !filtroEspecie || animal.especie === filtroEspecie;

            const atendeCastrado =
                !filtroCastrado ||
                (filtroCastrado === 'sim' && animal.ehCastrado) ||
                (filtroCastrado === 'nao' && !animal.ehCastrado);

            return atendePesquisa && atendeEspecie && atendeCastrado;
        });

        return [...filtrados].sort((a, b) => {
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
    }, [itens, pesquisa, filtroEspecie, filtroCastrado, ordenarPor, direcaoOrdenacao]);

    const totalPaginas = Math.max(1, Math.ceil(animaisFiltradosOrdenados.length / tamanhoPagina));

    useEffect(() => {
        if (pagina > totalPaginas) {
            setPagina(totalPaginas);
        }
    }, [pagina, totalPaginas]);

    useEffect(() => {
        setPagina(1);
    }, [pesquisa, filtroEspecie, filtroCastrado, ordenarPor, direcaoOrdenacao]);

    const animaisPaginados = useMemo(() => {
        const inicio = (pagina - 1) * tamanhoPagina;
        return animaisFiltradosOrdenados.slice(inicio, inicio + tamanhoPagina);
    }, [animaisFiltradosOrdenados, pagina, tamanhoPagina]);

    const animalConfirmacao = useMemo(() => {
        if (!confirmacaoExclusao) {
            return null;
        }

        return itens.find(a => a.id === confirmacaoExclusao.id) ?? null;
    }, [confirmacaoExclusao, itens]);

    const handleNovo = () => {
        dispatch(selecionarAnimal(null));
        setModoEdicao(false);
        setShowFormModal(true);
    };

    const handleEditar = (animal: Animal) => {
        dispatch(selecionarAnimal(animal));
        setModoEdicao(true);
        setShowFormModal(true);
    };

    const handleSalvar = async (dados: AnimalCreate | AnimalUpdate) => {
        if ('id' in dados && dados.id > 0) {
            const result = await dispatch(atualizarAnimal(dados as AnimalUpdate));

            if (atualizarAnimal.fulfilled.match(result)) {
                setShowFormModal(false);
            }

            return;
        }

        const result = await dispatch(criarAnimal(dados as AnimalCreate));

        if (criarAnimal.fulfilled.match(result)) {
            setShowFormModal(false);
            setPagina(1);
        }
    };

    const handleSolicitarExcluir = async (id: number) => {
        await dispatch(excluirAnimal({ id }));
    };

    const handleConfirmarExcluirComCastracoes = async () => {
        if (!confirmacaoExclusao) {
            return;
        }

        await dispatch(excluirAnimal({
            id: confirmacaoExclusao.id,
            excluirCastracoes: true
        }));
    };

    const handleCancelarExclusaoComCastracoes = () => {
        dispatch(limparConfirmacaoExclusaoAnimal());
    };

    const handleMudarTamanhoPagina = (novoTamanho: number) => {
        setTamanhoPagina(novoTamanho);
        setPagina(1);
    };

    const handleOrdenar = (campo: AnimalOrdenacaoCampo) => {
        if (ordenarPor === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
            return;
        }

        setOrdenarPor(campo);
        setDirecaoOrdenacao('asc');
    };

    const limparFiltros = () => {
        setPesquisa('');
        setFiltroEspecie('');
        setFiltroCastrado('');
        setOrdenarPor('nome');
        setDirecaoOrdenacao('asc');
        setPagina(1);
    };

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div>
                        <h2 className="h4 mb-0">Lista de Pets</h2>
                        <small className="text-muted">
                            {animaisFiltradosOrdenados.length} de {itens.length} pets exibidos.
                        </small>
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={handleNovo}>
                        Novo Pet
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
                                    placeholder="Nome, espécie, raça ou tutor"
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Espécie</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filtroEspecie}
                                    onChange={(e) => setFiltroEspecie(e.target.value)}
                                >
                                    <option value="">Todas</option>
                                    <option value="Felina">Felina</option>
                                    <option value="Canina">Canina</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Castrado</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filtroCastrado}
                                    onChange={(e) => setFiltroCastrado(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    <option value="sim">Sim</option>
                                    <option value="nao">Não</option>
                                </select>
                            </div>

                            <div className="col-md-2 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    type="button"
                                    onClick={limparFiltros}
                                >
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {carregando && <div className="alert alert-info">Carregando...</div>}
                {erro && <div className="alert alert-danger">{erro}</div>}

                <AnimaisList
                    animais={animaisPaginados}
                    onEditar={handleEditar}
                    onExcluir={handleSolicitarExcluir}
                    ordenarPor={ordenarPor}
                    direcaoOrdenacao={direcaoOrdenacao}
                    onOrdenar={handleOrdenar}
                />

                {animaisFiltradosOrdenados.length > 0 && (
                    <Paginacao
                        pagina={pagina}
                        tamanhoPagina={tamanhoPagina}
                        totalRegistros={animaisFiltradosOrdenados.length}
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
                                    {modoEdicao && selecionado ? 'Editar Pet' : 'Novo Pet'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowFormModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <AnimalForm
                                    animal={modoEdicao ? selecionado ?? undefined : undefined}
                                    onSubmit={handleSalvar}
                                    onCancel={() => setShowFormModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AnimalDeleteModal
                animal={animalConfirmacao}
                totalCastracoes={confirmacaoExclusao?.totalCastracoes ?? 0}
                mensagem={confirmacaoExclusao?.erro ?? ''}
                onCancel={handleCancelarExclusaoComCastracoes}
                onConfirm={handleConfirmarExcluirComCastracoes}
            />
        </div>
    );
};
