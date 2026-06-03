import React, { useEffect, useState } from 'react';
import { Clinica, ClinicaCreate, ClinicaUpdate } from '../../api/clinicasApi';

interface ClinicaFormProps {
    clinica?: Clinica;
    onSubmit: (dados: ClinicaCreate | ClinicaUpdate) => void | Promise<void>;
    onCancel?: () => void;
}

interface FormState {
    id?: number;
    nome: string;
    telefone: string;
    veterinarioResponsavel: string;
}

const initialForm: FormState = {
    nome: '',
    telefone: '',
    veterinarioResponsavel: ''
};

export const ClinicaForm: React.FC<ClinicaFormProps> = ({ clinica, onSubmit, onCancel }) => {
    const [form, setForm] = useState<FormState>(initialForm);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | undefined>();

    useEffect(() => {
        if (clinica) {
            setForm({
                id: clinica.id,
                nome: clinica.nome,
                telefone: clinica.telefone,
                veterinarioResponsavel: clinica.veterinarioResponsavel
            });
        } else {
            setForm(initialForm);
        }
    }, [clinica]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        let novoValor = value;
        if (name === 'telefone') {
            let v = value.replace(/\D/g, '');
            if (v.length > 11) v = v.substring(0, 11);

            if (v.length <= 10) {
                v = v.replace(/(\d{2})(\d)/, '($1) $2');
                v = v.replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                v = v.replace(/(\d{2})(\d)/, '($1) $2');
                v = v.replace(/(\d{5})(\d{4})/, '$1-$2');
            }
            novoValor = v;
        }

        setForm(prev => ({
            ...prev,
            [name]: novoValor
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(undefined);

        if (!form.nome || !form.telefone) {
            setErro('Preencha os campos obrigatórios (Nome e Telefone).');
            return;
        }

        const payload: ClinicaCreate | ClinicaUpdate = form.id
            ? {
                  id: form.id,
                  nome: form.nome,
                  telefone: form.telefone,
                  veterinarioResponsavel: form.veterinarioResponsavel
              }
            : {
                  nome: form.nome,
                  telefone: form.telefone,
                  veterinarioResponsavel: form.veterinarioResponsavel
              };

        try {
            setSalvando(true);
            await onSubmit(payload);
            if (!form.id) {
                setForm(initialForm);
            }
        } catch {
            setErro('Erro ao salvar clínica.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {erro && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {erro}
                <button type="button" className="btn-close" onClick={() => setErro(undefined)}></button>
            </div>}

            <div className="mb-3">
                <label htmlFor="nome" className="form-label">Nome da Clínica <span className="text-danger">*</span></label>
                <input
                    type="text"
                    className="form-control"
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Ex: Clínica Veterinária Pet"
                    required
                />
            </div>

            <div className="mb-3">
                <label htmlFor="telefone" className="form-label">Telefone <span className="text-danger">*</span></label>
                <input
                    type="tel"
                    className="form-control"
                    id="telefone"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    required
                />
            </div>

            <div className="mb-3">
                <label htmlFor="veterinarioResponsavel" className="form-label">Veterinário Responsável</label>
                <input
                    type="text"
                    className="form-control"
                    id="veterinarioResponsavel"
                    name="veterinarioResponsavel"
                    value={form.veterinarioResponsavel}
                    onChange={handleChange}
                    placeholder="Ex: Dr. João Silva"
                />
            </div>

            <div className="d-flex gap-2 justify-content-end">
                {onCancel && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={salvando}>
                        Cancelar
                    </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};
