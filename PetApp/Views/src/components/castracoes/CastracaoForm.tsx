import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animal } from '../../api/animaisApi';
import { Castracao } from '../../api/castracoeApi';
import { axiosClient } from '../../api/axiosClient';

interface CastracaoFormProps {
    onSubmit: (dados: any) => void | Promise<void>;
    onCancel?: () => void;
    castracao?: Castracao;
}

interface FormState {
    dataCastracao: string;
    valor: number | '';
    idAnimal: number;
    idClinica: number;
    observacoes: string;
}

const obterDataAtualIso = (): string => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
};

const aplicarMascaraDataBr = (valor: string): string => {
    const numeros = valor.replace(/\D/g, '').slice(0, 8);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 4) {
        return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
};

const formatarIsoParaBr = (dataIso: string): string => {
    if (!dataIso) {
        return '';
    }

    const somenteData = dataIso.split('T')[0];
    const [ano, mes, dia] = somenteData.split('-');

    if (!ano || !mes || !dia) {
        return '';
    }

    return `${dia}/${mes}/${ano}`;
};

const converterBrParaIso = (dataBr: string): string => {
    const match = dataBr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        return '';
    }

    const [, dia, mes, ano] = match;

    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));

    const dataValida =
        data.getFullYear() === Number(ano) &&
        data.getMonth() === Number(mes) - 1 &&
        data.getDate() === Number(dia);

    if (!dataValida) {
        return '';
    }

    return `${ano}-${mes}-${dia}`;
};

const normalizarDataApiParaIso = (data: string | undefined): string => {
    if (!data) {
        return obterDataAtualIso();
    }

    const somenteData = data.split('T')[0];
    const [ano, mes, dia] = somenteData.split('-');

    if (!ano || !mes || !dia) {
        return obterDataAtualIso();
    }

    return `${ano}-${mes}-${dia}`;
};

const initialForm: FormState = {
    dataCastracao: obterDataAtualIso(),
    valor: '',
    idAnimal: 0,
    idClinica: 0,
    observacoes: ''
};

const extrairMensagemErro = (error: any): string => {
    const data = error?.response?.data;

    if (!data) {
        return error?.message ?? 'Erro ao salvar castração.';
    }

    if (typeof data === 'string') {
        return data;
    }

    if (typeof data?.erro === 'string') {
        return data.erro;
    }

    if (typeof data?.message === 'string') {
        return data.message;
    }

    if (typeof data?.title === 'string') {
        return data.title;
    }

    if (typeof data === 'object') {
        const mensagens = Object.values(data)
            .flatMap((valor: any) => {
                if (Array.isArray(valor)) {
                    return valor;
                }

                if (typeof valor === 'string') {
                    return [valor];
                }

                return [];
            })
            .filter(Boolean);

        if (mensagens.length > 0) {
            return mensagens.join(', ');
        }
    }

    return 'Erro ao salvar castração.';
};

export const CastracaoForm: React.FC<CastracaoFormProps> = ({ onSubmit, onCancel, castracao }) => {
    const [form, setForm] = useState<FormState>(initialForm);
    const [dataCastracaoBr, setDataCastracaoBr] = useState(formatarIsoParaBr(initialForm.dataCastracao));
    const [animaisNaoCastrados, setAnimaisNaoCastrados] = useState<Animal[]>([]);
    const [clinicas, setClinicas] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | undefined>();
    const dataPickerRef = useRef<HTMLInputElement>(null);

    const modoEdicao = Boolean(castracao?.id);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                setCarregando(true);
                setErro(undefined);

                const [animaisRes, clinicasRes] = await Promise.all([
                    axiosClient.get('/animais'),
                    axiosClient.get('/clinicas')
                ]);

                setAnimaisNaoCastrados(animaisRes.data);
                setClinicas(clinicasRes.data);
            } catch (error) {
                setErro(extrairMensagemErro(error));
            } finally {
                setCarregando(false);
            }
        };

        carregarDados();
    }, []);

    useEffect(() => {
        if (castracao) {
            const dataIso = normalizarDataApiParaIso(castracao.dataCastracao);

            setForm({
                dataCastracao: dataIso,
                valor: castracao.valor,
                idAnimal: castracao.idAnimal,
                idClinica: castracao.idClinica,
                observacoes: castracao.observacoes || ''
            });

            setDataCastracaoBr(formatarIsoParaBr(dataIso));
            return;
        }

        setForm(initialForm);
        setDataCastracaoBr(formatarIsoParaBr(initialForm.dataCastracao));
    }, [castracao]);

    const animaisDisponiveis = useMemo(() => {
        if (!modoEdicao) {
            return animaisNaoCastrados.filter(animal => !animal.ehCastrado);
        }

        return animaisNaoCastrados;
    }, [animaisNaoCastrados, modoEdicao]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        let newValue: any = value;

        if (name === 'valor') {
            newValue = value === '' ? '' : Number(value);
        } else if (name === 'idAnimal' || name === 'idClinica') {
            newValue = value ? Number(value) : 0;
        }

        setForm(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    const handleDataBrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorBr = aplicarMascaraDataBr(e.target.value);
        const valorIso = converterBrParaIso(valorBr);

        setDataCastracaoBr(valorBr);

        setForm(prev => ({
            ...prev,
            dataCastracao: valorIso
        }));
    };

    const handleDataPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorIso = e.target.value;

        setForm(prev => ({
            ...prev,
            dataCastracao: valorIso
        }));

        setDataCastracaoBr(formatarIsoParaBr(valorIso));
    };

    const abrirCalendario = () => {
        const picker = dataPickerRef.current as HTMLInputElement & {
            showPicker?: () => void;
        };

        if (!picker) {
            return;
        }

        if (typeof picker.showPicker === 'function') {
            picker.showPicker();
            return;
        }

        picker.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(undefined);

        if (!dataCastracaoBr || !form.dataCastracao) {
            setErro('Data da castração é obrigatória e deve estar no formato dd/mm/aaaa.');
            return;
        }

        if (!form.valor || form.valor <= 0) {
            setErro('Valor é obrigatório e deve ser maior que zero.');
            return;
        }

        if (!form.idAnimal || form.idAnimal <= 0) {
            setErro('Selecione um animal válido.');
            return;
        }

        if (!form.idClinica || form.idClinica <= 0) {
            setErro('Selecione uma clínica válida.');
            return;
        }

        try {
            setSalvando(true);

            const payload = {
                ...(modoEdicao ? { id: castracao!.id } : {}),
                dataCastracao: `${form.dataCastracao}T00:00:00`,
                valor: Number(form.valor),
                idAnimal: form.idAnimal,
                idClinica: form.idClinica,
                observacoes: form.observacoes ?? ''
            };

            await onSubmit(payload);

            if (!modoEdicao) {
                setForm(initialForm);
                setDataCastracaoBr(formatarIsoParaBr(initialForm.dataCastracao));
            }
        } catch (error) {
            setErro(extrairMensagemErro(error));
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return <div className="alert alert-info">Carregando dados...</div>;
    }

    if (animaisDisponiveis.length === 0 && !modoEdicao) {
        return (
            <div className="alert alert-warning">
                Todos os animais já foram castrados ou não há animais disponíveis.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-body">
                {erro && <div className="alert alert-danger">{erro}</div>}

                <div className="mb-2">
                    <label className="form-label">Data da Castração *</label>
                    <div className="input-group input-group-sm">
                        <input
                            type="text"
                            name="dataCastracaoBr"
                            className="form-control"
                            value={dataCastracaoBr}
                            onChange={handleDataBrChange}
                            placeholder="dd/mm/aaaa"
                            inputMode="numeric"
                            maxLength={10}
                            required
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={abrirCalendario}
                            title="Selecionar data"
                        >
                            📅
                        </button>
                        <input
                            ref={dataPickerRef}
                            type="date"
                            value={form.dataCastracao}
                            onChange={handleDataPickerChange}
                            style={{
                                position: 'absolute',
                                width: 1,
                                height: 1,
                                opacity: 0,
                                pointerEvents: 'none'
                            }}
                            tabIndex={-1}
                            aria-hidden="true"
                        />
                    </div>
                    <small className="form-text text-muted">
                        Formato exibido: dd/mm/aaaa. Valor enviado internamente: yyyy-mm-dd.
                    </small>
                </div>

                <div className="mb-2">
                    <label className="form-label">Valor (R$) *</label>
                    <input
                        type="number"
                        name="valor"
                        className="form-control form-control-sm"
                        value={form.valor}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                <div className="mb-2">
                    <label className="form-label">Animal *</label>
                    <select
                        name="idAnimal"
                        className="form-select form-select-sm"
                        value={form.idAnimal || 0}
                        onChange={handleChange}
                        required
                    >
                        <option value={0}>Selecione um animal...</option>
                        {animaisDisponiveis.map(animal => (
                            <option key={animal.id} value={animal.id}>
                                {animal.nome} ({animal.especie})
                            </option>
                        ))}
                    </select>
                    <small className="form-text text-muted">
                        {modoEdicao
                            ? 'Edição de castração existente.'
                            : `Animais disponíveis para castração: ${animaisDisponiveis.length}`}
                    </small>
                </div>

                <div className="mb-2">
                    <label className="form-label">Clínica *</label>
                    <select
                        name="idClinica"
                        className="form-select form-select-sm"
                        value={form.idClinica || 0}
                        onChange={handleChange}
                        required
                    >
                        <option value={0}>Selecione uma clínica...</option>
                        {clinicas.map(clinica => (
                            <option key={clinica.id} value={clinica.id}>
                                {clinica.nome}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-2">
                    <label className="form-label">Observações</label>
                    <textarea
                        name="observacoes"
                        className="form-control form-control-sm"
                        value={form.observacoes}
                        onChange={handleChange}
                        rows={3}
                        maxLength={500}
                    />
                </div>
            </div>

            <div className="card-footer d-flex justify-content-end gap-2">
                {onCancel && (
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={onCancel}
                        disabled={salvando}
                    >
                        Cancelar
                    </button>
                )}
                <button
                    className="btn btn-primary btn-sm"
                    type="submit"
                    disabled={salvando || (animaisDisponiveis.length === 0 && !modoEdicao)}
                >
                    {salvando ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};
