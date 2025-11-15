package com.clinicaestetica.schedule.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping; // IMPORTADO
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.clinicaestetica.schedule.model.Agendamento;
import com.clinicaestetica.schedule.model.Especialidade;
import com.clinicaestetica.schedule.model.Profissional;
import com.clinicaestetica.schedule.model.Solicitacao;
import com.clinicaestetica.schedule.service.AdministradorService;
import com.clinicaestetica.schedule.enums.StatusSolicitacao;
import com.clinicaestetica.schedule.model.Administrador;
import java.util.Optional;


@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdministradorController {

    @Autowired
    private AdministradorService administradorService;

    @PostMapping("/login")
    public ResponseEntity<Administrador> login(@RequestBody Map<String, String> credenciais) {
        Optional<Administrador> admin = administradorService.login(credenciais.get("email"), credenciais.get("senha"));
        if(admin.isPresent()) {
            return ResponseEntity.ok(admin.get());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/profissionais")
    public ResponseEntity<Profissional> criarProfissional(@RequestBody Profissional profissional) {
        Profissional novoProfissional = administradorService.criarProfissional(profissional);
        return new ResponseEntity<>(novoProfissional, HttpStatus.CREATED);
    }

    // --- ENDPOINT EDITAR (NOVO) ---
    @PutMapping("/profissionais/{id}")
    public ResponseEntity<Profissional> atualizarProfissional(@PathVariable Long id, @RequestBody Profissional profissional) {
        Profissional profissionalAtualizado = administradorService.atualizarProfissional(id, profissional);
        return ResponseEntity.ok(profissionalAtualizado);
    }
    
    @DeleteMapping("/profissionais/{id}")
    public ResponseEntity<Profissional> deletarProfissional(@PathVariable Long id) {
        Profissional profissionalDeletado = administradorService.deletarProfissional(id);
        return ResponseEntity.ok(profissionalDeletado);
    }

    @DeleteMapping("/agendamentos/{id}")
    public ResponseEntity<Agendamento> deletarAgendamento(@PathVariable Long id) {
        Agendamento agendamentoDeletado = administradorService.deletarAgendamento(id);
        return ResponseEntity.ok(agendamentoDeletado);
    }
    
    @GetMapping("/solicitacoes")
    public ResponseEntity<List<Solicitacao>> listarSolicitacoes() {
        List<Solicitacao> solicitacoes = administradorService.listarSolicitacoes();
        return ResponseEntity.ok(solicitacoes);
    }

    @GetMapping("/profissionais")
    public ResponseEntity<List<Profissional>> listarProfissionais() {
        List<Profissional> profissionais = administradorService.listarProfissionais();
        return ResponseEntity.ok(profissionais);
    }

    @PostMapping("/solicitacoes/{id}/processar")
    public ResponseEntity<Solicitacao> processarSolicitacao(@PathVariable Long id, @RequestParam StatusSolicitacao status) {
        Solicitacao solicitacao = administradorService.processarSolicitacao(id, status);
        return ResponseEntity.ok(solicitacao);
    }
    
    @PutMapping("/agendamentos/{id}")
    public ResponseEntity<Agendamento> atualizarAgendamentoDireto(@PathVariable Long id, @RequestBody Agendamento agendamento) {
        Agendamento agendamentoAtualizado = administradorService.atualizarAgendamentoDireto(id, agendamento);
        return ResponseEntity.ok(agendamentoAtualizado);
    }
    
    @GetMapping("/calendario/completo")
    public ResponseEntity<Map<String, List<Agendamento>>> getCalendarioCompleto(
            @RequestParam(required = false) LocalDate dataInicio,
            @RequestParam(required = false) LocalDate dataFim) {
        Map<String, List<Agendamento>> calendario = administradorService.getCalendarioCompleto(dataInicio, dataFim);
        return ResponseEntity.ok(calendario);
    }
    
    @GetMapping("/calendario/profissional/{profissionalId}")
    public ResponseEntity<List<Agendamento>> getCalendarioProfissional(
            @PathVariable Long profissionalId,
            @RequestParam(required = false) LocalDate dataInicio,
            @RequestParam(required = false) LocalDate dataFim) {
        List<Agendamento> calendario = administradorService.getCalendarioProfissional(profissionalId, dataInicio, dataFim);
        return ResponseEntity.ok(calendario);
    }

    @PostMapping("/especialidades/{especialidadeId}/servicos/{servicoId}")
    public ResponseEntity<Especialidade> associarServico(@PathVariable Long especialidadeId, @PathVariable Long servicoId) {
        Especialidade especialidade = administradorService.associarServico(especialidadeId, servicoId);
        return ResponseEntity.ok(especialidade);
    }

    @PostMapping("/especialidades/{especialidadeId}/profissionais/{profissionalId}")
    public ResponseEntity<Profissional> associarProfissional(@PathVariable Long especialidadeId, @PathVariable Long profissionalId) {
        Profissional profissional = administradorService.associarProfissional(especialidadeId, profissionalId);
        return ResponseEntity.ok(profissional);
    }
}