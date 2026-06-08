import React, { useEffect, useState } from 'react';
import { Tutor, TutorCreate, TutorUpdate } from '../../api/tutoresApi';

interface TutorFormProps {
    tutor?: Tutor;
    onSubmit: (dados: TutorCreate | TutorUpdate) => void | Promise<void>;
    onCancel?: () => void;
}

interface FormState {
    id?: number;
    nome: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    endereco: string;
    telefone: string;
}

interface ViaCepResponse {
    cep?: string;
    logradouro?: string;
    complemento?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    erro?: boolean;
}

const initialForm: FormState = {
    nome: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    endereco: '',
    telefone: ''
};

const aplicarMascaraTelefone = (valor: string): string => {
    let v = valor.replace(/\D/g, '');

    if (v.length > 11) {
        v = v.substring(0, 11);
    }

    if (!v) {
        return '';
    }

    if (v.length <= 10) {
        v = v.replace(/(\d{2})(\d)/, '($1) $2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
        return v;
    }

    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d{4})/, '$1-$2');

    return v;
};

const aplicarMascaraCep = (valor: string): string => {
    const numeros = valor.replace(/\D/g, '').slice(0, 8);

    if (numeros.length <= 5) {
        return numeros;
    }

    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
};

const obterCepNumerico = (cep: string): string => {
    return cep.replace(/\D/g, '');
};

const montarEndereco = (form: FormState): string => {
    const partes: string[] = [];

    if (form.logradouro.trim()) {
        let logradouro = form.logradouro.trim();

        if (form.numero.trim()) {
            logradouro += `, ${form.numero.trim()}`;
        }

        partes.push(logradouro);
    } else if (form.endereco.trim()) {
        partes.push(form.endereco.trim());
    }

    if (form.complemento.trim()) {
        partes.push(form.complemento.trim());
    }

    if (form.bairro.trim()) {
        partes.push(form.bairro.trim());
    }

    if (form.cidade.trim() && form.uf.trim()) {
        partes.push(`${form.cidade.trim()}/${form.uf.trim().toUpperCase()}`);
    } else if (form.cidade.trim()) {
        partes.push(form.cidade.trim());
    } else if (form.uf.trim()) {
        partes.push(form.uf.trim().toUpperCase());
    }

    if (form.cep.trim()) {
        partes.push(`CEP ${form.cep.trim()}`);
    }

    return partes.join(' - ');
};

export const TutorForm: React.FC<TutorFormProps> = ({ tutor, onSubmit, onCancel }) => {
    const [form, setForm] = useState<FormState>(initialForm);
    const [salvando, setSalvando] = useState(false);
    const [consultandoCep, setConsultandoCep] = useState(false);
    const [erro, setErro] = useState<string | undefined>();
    const [avisoCep, setAvisoCep] = useState<string | undefined>();

    useEffect(() => {
        if (tutor) {
            setForm({
                id: tutor.id,
                nome: tutor.nome ?? '',
                cep: tutor.cep ?? '',
                logradouro: tutor.logradouro ?? '',
                numero: tutor.numero ?? '',
                complemento: tutor.complemento ?? '',
                bairro: tutor.bairro ?? '',
                cidade: tutor.cidade ?? '',
                uf: tutor.uf ?? '',
                endereco: tutor.endereco ?? '',
                telefone: tutor.telefone ?? ''
            });
            return;
        }

        setForm(initialForm);
    }, [tutor]);

    useEffect(() => {
        const cepNumerico = obterCepNumerico(form.cep);

        if (cepNumerico.length !== 8) {
            setAvisoCep(undefined);
            return;
        }

        const controller = new AbortController();

        const buscarCep = async () => {
            try {
                setConsultandoCep(true);
                setAvisoCep(undefined);

                const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`, {
                    signal: controller.signal
                });

                if (!response.ok) {
                    setAvisoCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.');
                    return;
                }

                const dados = await response.json() as ViaCepResponse;

                if (dados.erro) {
                    setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.');
                    return;
                }

                setForm(prev => ({
                    ...prev,
                    cep: aplicarMascaraCep(dados.cep ?? prev.cep),
                    logradouro: dados.logradouro ?? prev.logradouro,
                    bairro: dados.bairro ?? prev.bairro,
                    cidade: dados.localidade ?? prev.cidade,
                    uf: dados.uf ?? prev.uf,
                    complemento: prev.complemento || dados.complemento || ''
                }));

                if (!dados.logradouro && !dados.bairro) {
                    setAvisoCep('CEP geral localizado. Complete rua, bairro, número e complemento manualmente.');
                }
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    setAvisoCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.');
                }
            } finally {
                setConsultandoCep(false);
            }
        };

        buscarCep();

        return () => {
            controller.abort();
        };
    }, [form.cep]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        let novoValor = value;

        if (name === 'telefone') {
            novoValor = aplicarMascaraTelefone(value);
        }

        if (name === 'cep') {
            novoValor = aplicarMascaraCep(value);
        }

        if (name === 'uf') {
            novoValor = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        }

        setForm(prev => ({
            ...prev,
            [name]: novoValor
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(undefined);

        if (!form.nome.trim()) {
            setErro('Nome do tutor é obrigatório.');
            return;
        }

        const telefoneDigitos = form.telefone.replace(/\D/g, '');

        if (!telefoneDigitos) {
            setErro('Telefone do tutor é obrigatório.');
            return;
        }

        if (telefoneDigitos.length !== 10 && telefoneDigitos.length !== 11) {
            setErro('Telefone inválido. Informe DDD e número.');
            return;
        }

        const cepNumerico = obterCepNumerico(form.cep);

        if (!cepNumerico) {
            setErro('CEP do tutor é obrigatório.');
            return;
        }

        if (cepNumerico.length !== 8) {
            setErro('CEP inválido. Use o formato 00000-000.');
            return;
        }

        if (!form.logradouro.trim()) {
            setErro('Rua ou logradouro é obrigatório.');
            return;
        }

        if (!form.numero.trim()) {
            setErro('Número é obrigatório. Use S/N quando não houver número.');
            return;
        }

        if (!form.bairro.trim()) {
            setErro('Bairro é obrigatório.');
            return;
        }

        if (!form.cidade.trim()) {
            setErro('Cidade é obrigatória.');
            return;
        }

        if (!form.uf.trim() || form.uf.trim().length !== 2) {
            setErro('UF é obrigatória e deve conter 2 letras.');
            return;
        }

        const enderecoMontado = montarEndereco(form);

        const payloadBase = {
            nome: form.nome.trim(),
            endereco: enderecoMontado,
            cep: form.cep.trim(),
            logradouro: form.logradouro.trim(),
            numero: form.numero.trim(),
            complemento: form.complemento.trim(),
            bairro: form.bairro.trim(),
            cidade: form.cidade.trim(),
            uf: form.uf.trim().toUpperCase(),
            telefone: form.telefone.trim() === '(99) 99999-9999' ? '' : form.telefone.trim()
        };

        const payload: TutorCreate | TutorUpdate = form.id
            ? {
                  id: form.id,
                  ...payloadBase
              }
            : payloadBase;

        try {
            setSalvando(true);
            await onSubmit(payload);

            if (!form.id) {
                setForm(initialForm);
            }
        } catch {
            setErro('Erro ao salvar tutor.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-body">
                {erro && <div className="alert alert-danger">{erro}</div>}

                <div className="mb-2">
                    <label className="form-label">Nome <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        name="nome"
                        className="form-control form-control-sm"
                        value={form.nome}
                        onChange={handleChange}
                        maxLength={200}
                        required
                    />
                </div>

                <div className="row">
                    <div className="col-md-4 mb-2">
                        <label className="form-label">CEP <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="cep"
                            className="form-control form-control-sm"
                            value={form.cep}
                            onChange={handleChange}
                            maxLength={9}
                            placeholder="00000-000"
                            inputMode="numeric"
                            required
                        />
                        <small className="form-text text-muted">
                            {consultandoCep ? 'Consultando CEP...' : 'Digite o CEP para preencher o endereço.'}
                        </small>
                    </div>

                    <div className="col-md-6 mb-2">
                        <label className="form-label">Cidade <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="cidade"
                            className="form-control form-control-sm"
                            value={form.cidade}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="col-md-2 mb-2">
                        <label className="form-label">UF <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="uf"
                            className="form-control form-control-sm text-uppercase"
                            value={form.uf}
                            onChange={handleChange}
                            maxLength={2}
                            required
                        />
                    </div>
                </div>

                {avisoCep && <div className="alert alert-warning py-2">{avisoCep}</div>}

                <div className="row">
                    <div className="col-md-8 mb-2">
                        <label className="form-label">Rua / Logradouro <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="logradouro"
                            className="form-control form-control-sm"
                            value={form.logradouro}
                            onChange={handleChange}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="col-md-4 mb-2">
                        <label className="form-label">Número <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="numero"
                            className="form-control form-control-sm"
                            value={form.numero}
                            onChange={handleChange}
                            maxLength={20}
                            required
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 mb-2">
                        <label className="form-label">Bairro <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="bairro"
                            className="form-control form-control-sm"
                            value={form.bairro}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="col-md-6 mb-2">
                        <label className="form-label">Complemento</label>
                        <input
                            type="text"
                            name="complemento"
                            className="form-control form-control-sm"
                            value={form.complemento}
                            onChange={handleChange}
                            maxLength={100}
                        />
                    </div>
                </div>

                <div className="mb-2">
                    <label className="form-label">Endereço completo</label>
                    <input
                        type="text"
                        name="endereco"
                        className="form-control form-control-sm"
                        value={montarEndereco(form)}
                        readOnly
                    />
                </div>

                <div className="mb-2">
                    <label className="form-label">Telefone <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        name="telefone"
                        className="form-control form-control-sm"
                        value={form.telefone}
                        onChange={handleChange}
                        maxLength={15}
                        placeholder="(99) 99999-9999"
                        required
                    />
                    <small className="form-text text-muted">
                        Formato: (XX) XXXXX-XXXX
                    </small>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
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
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </form>
    );
};
