package com.clinicaestetica.schedule.controller;

import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;
import com.clinicaestetica.schedule.model.Profissional;
import com.clinicaestetica.schedule.model.Servico;
import com.clinicaestetica.schedule.service.ServicoService;

@RestController
@RequestMapping("/servicos")
@CrossOrigin(origins = "http://localhost:3000")
public class ServicoController {
    
    @Autowired
    private ServicoService servicoService;

    @GetMapping
    public List<Servico> listarServicos(){
        return servicoService.listarServicos();
    }

    @GetMapping("/{id}/profissionais")
    public List<Profissional> getProfissionaisPorServico(@PathVariable Long id) {
        return servicoService.getProfissionaisPorServico(id);
    }

    @PostMapping
    public ResponseEntity<Servico> criarServico(@RequestBody Servico servico) {
        Servico novoServico = servicoService.criarServico(servico);
        return new ResponseEntity<>(novoServico, HttpStatus.CREATED);
    }

    // --- ENDPOINT EDITAR (NOVO) ---
    @PutMapping("/{id}")
    public ResponseEntity<Servico> atualizarServico(@PathVariable Long id, @RequestBody Servico servico) {
        Servico servicoAtualizado = servicoService.atualizarServico(id, servico);
        return ResponseEntity.ok(servicoAtualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarServico(@PathVariable Long id) {
        servicoService.deletarServico(id);
        return ResponseEntity.noContent().build();
    }
}